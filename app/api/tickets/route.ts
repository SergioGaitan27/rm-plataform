import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket, { ITicket } from '@/models/Ticket';
import Product, { IProduct, IStockLocation } from '@/models/Product';
import mongoose from 'mongoose';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_APP_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

// Definimos un tipo simple para los items del ticket
interface SimpleTicketItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  pricePerUnit: number;
  costPerUnit: number;
  total: number;
  profit: number;
}

interface TicketRequestBody {
  items: {
    productId: string;
    pricePerUnit: number;
    quantity: number;
    unitType: 'pieces' | 'boxes';
  }[];
  totalAmount: number;
  paymentType: 'cash' | 'card';
  amountPaid: number;
  change: number;
  location: string;
}

async function getNextSequenceNumber(location: string): Promise<number> {
  const lastTicket = await Ticket.findOne({ location }).sort('-sequenceNumber');
  return lastTicket ? lastTicket.sequenceNumber + 1 : 1;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body: TicketRequestBody = await req.json();
    
    const { items, totalAmount, paymentType, amountPaid, change, location } = body;
    
    const sequenceNumber = await getNextSequenceNumber(location);
    const ticketId = `${location}-${sequenceNumber.toString().padStart(6, '0')}`;

    let totalProfit = 0;
    const updatedItems: SimpleTicketItem[] = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.productId}`);
      }

      const costPerUnit = product.cost;
      const pricePerUnit = item.pricePerUnit;
      const quantity = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;
      const profit = (pricePerUnit - costPerUnit) * quantity;

      totalProfit += profit;

      return {
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitType: item.unitType,
        pricePerUnit: pricePerUnit,
        costPerUnit: costPerUnit,
        total: pricePerUnit * quantity,
        profit: profit
      };
    }));

    const newTicket: ITicket = new Ticket({
      ticketId,
      location,
      sequenceNumber,
      items: updatedItems,
      totalAmount,
      totalProfit,
      paymentType,
      amountPaid,
      change
    });

    await newTicket.save();

    // Actualizar el stock de los productos
    const updatedProductIds = await Promise.all(updatedItems.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (product) {
        const totalPieces = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;
        const locationIndex = product.stockLocations.findIndex((loc: IStockLocation) => loc.location === location);
        if (locationIndex !== -1) {
          product.stockLocations[locationIndex].quantity -= totalPieces;
          await product.save();
          return product._id.toString();
        }
      }
      return null;
    }));

    const updatedProducts = await Product.find({ _id: { $in: updatedProductIds.filter(Boolean) } });

    // Trigger Pusher event with profit information
    await pusher.trigger('sales-channel', 'new-sale', {
      profit: totalProfit,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      message: 'Ticket guardado exitosamente', 
      ticket: newTicket,
      updatedProducts: updatedProducts
    }, { status: 201 });
  } catch (error) {
    console.error('Error al guardar el ticket:', error);
    return NextResponse.json({ error: 'Error al guardar el ticket' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    startDate.setHours(0, 0, 0, 0); // Inicio del día
    endDate.setHours(23, 59, 59, 999); // Fin del día

    const query: any = {
      date: { $gte: startDate, $lte: endDate },
    };

    const tickets = await Ticket.find(query).sort({ date: -1 });

    // Calcular el beneficio total, conteo de ventas, y agrupar por ubicación
    const locationProfits: Record<string, number> = {};
    let totalProfit = 0;
    tickets.forEach(ticket => {
      totalProfit += ticket.totalProfit;
      locationProfits[ticket.location] = (locationProfits[ticket.location] || 0) + ticket.totalProfit;
    });

    const locations = Object.keys(locationProfits).map(location => ({
      location,
      profit: locationProfits[location],
    }));

    return NextResponse.json({
      totalProfit,
      locations,
    });
  } catch (error) {
    console.error('Error al obtener los tickets:', error);
    return NextResponse.json({ error: 'Error al obtener los tickets' }, { status: 500 });
  }
}
