//app/api/corte/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Corte from '@/models/Corte';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { location, actualCash, actualCard } = await req.json();

    const now = new Date();
    const corteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(corteDate);
    endDate.setDate(endDate.getDate() + 1);

    const tickets = await Ticket.find({
      location,
      date: {
        $gte: corteDate,
        $lt: endDate
      }
    });

    let expectedCash = 0;
    let expectedCard = 0;

    tickets.forEach(ticket => {
      if (ticket.paymentType === 'cash') {
        expectedCash += ticket.totalAmount;
      } else if (ticket.paymentType === 'card') {
        expectedCard += ticket.totalAmount;
      }
    });

    const newCorte = new Corte({
      location,
      date: corteDate,
      expectedCash,
      expectedCard,
      actualCash,
      actualCard,
      totalTickets: tickets.length
    });
    await newCorte.save();

    return NextResponse.json({
      success: true,
      data: {
        expectedCash,
        expectedCard,
        actualCash,
        actualCard,
        totalTickets: tickets.length,
        corteId: newCorte._id
      }
    });

  } catch (error) {
    console.error('Error al realizar el corte:', error);
    return NextResponse.json({ success: false, message: 'Error al realizar el corte' }, { status: 500 });
  }
}