import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const ticketId = params.id;
    const ticket = await Ticket.findOne({ ticketId });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error al obtener el ticket:', error);
    return NextResponse.json({ error: 'Error al obtener el ticket' }, { status: 500 });
  }
}