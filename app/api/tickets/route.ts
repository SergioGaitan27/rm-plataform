// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Product from '@/models/Product';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Validar y procesar los datos del ticket
    const { items, totalAmount, paymentType, amountPaid, change } = body;
    
    // Crear el nuevo ticket
    const newTicket = new Ticket({
      items,
      totalAmount,
      paymentType,
      amountPaid,
      change
    });

    // Guardar el ticket en la base de datos
    await newTicket.save();

    // Actualizar el stock de los productos y recopilar los IDs de los productos actualizados
    const updatedProductIds = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const totalPieces = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;
        product.stockLocations[0].quantity -= totalPieces; // Asumiendo que solo hay una ubicación de stock
        await product.save();
        updatedProductIds.push(product._id);
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