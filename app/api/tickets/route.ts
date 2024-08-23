import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Product from '@/models/Product';

async function getNextSequenceNumber(location: string) {
  const lastTicket = await Ticket.findOne({ location }).sort('-sequenceNumber');
  return lastTicket ? lastTicket.sequenceNumber + 1 : 1;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Validar y procesar los datos del ticket
    const { items, totalAmount, paymentType, amountPaid, change, location } = body;
    
    // Obtener el siguiente número de secuencia para esta ubicación
    const sequenceNumber = await getNextSequenceNumber(location);
    
    // Crear el ticketId
    const ticketId = `${location}-${sequenceNumber.toString().padStart(6, '0')}`;

    // Crear el nuevo ticket
    const newTicket = new Ticket({
      ticketId,
      location,
      sequenceNumber,
      items,
      totalAmount,
      paymentType,
      amountPaid,
      change
    });

    // Guardar el ticket en la base de datos
    await newTicket.save();

    // Actualizar el stock de los productos y recopilar los IDs de los productos actualizados
    const updatedProductIds: string[] = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const totalPieces = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;
        const locationIndex = product.stockLocations.findIndex((loc: { location: string }) => loc.location === location);
        if (locationIndex !== -1) {
          product.stockLocations[locationIndex].quantity -= totalPieces;
          await product.save();
          updatedProductIds.push(product._id.toString());
        }
      }
    }

    // Obtener los productos actualizados
    const updatedProducts = await Product.find({ _id: { $in: updatedProductIds } });

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
    const tickets = await Ticket.find({}).sort({ date: -1 });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error al obtener los tickets:', error);
    return NextResponse.json({ error: 'Error al obtener los tickets' }, { status: 500 });
  }
}