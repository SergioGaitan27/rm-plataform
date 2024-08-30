import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket, { ITicket } from '@/models/Ticket';
import Product, { IProduct, IStockLocation } from '@/models/Product';
import mongoose from 'mongoose';
import { getSocketInstance } from '@/lib/socket';

// Define a simple type for ticket items
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
        throw new Error(`Product not found: ${item.productId}`);
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

    // Update product stock
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

    // Emit new ticket event via Socket.IO
    const io = getSocketInstance();
    if (io) {
      io.emit('newTicket', {
        date: newTicket.date,
        profit: newTicket.totalProfit,
        sales: newTicket.totalAmount,
        location: newTicket.location
      });
    }

    return NextResponse.json({ 
      message: 'Ticket saved successfully', 
      ticket: newTicket,
      updatedProducts: updatedProducts
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving ticket:', error);
    return NextResponse.json({ error: 'Error saving ticket' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const location = searchParams.get('location');

    const query: any = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (location) {
      query.location = location;
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(query)
    ]);

    return NextResponse.json({
      tickets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 });
  }
}