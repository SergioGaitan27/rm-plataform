import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket, { ITicket } from '@/models/Ticket';

export async function getInitialSalesData(req: Request) {
  try {
    await connectDB();

    // Obtener el beneficio total
    const totalProfitResult = await Ticket.aggregate<{ _id: null; totalProfit: number }>([
      { $group: { _id: null, totalProfit: { $sum: "$totalProfit" } } }
    ]);
    const totalProfit = totalProfitResult.length > 0 ? totalProfitResult[0].totalProfit : 0;

    // Obtener el número total de ventas
    const saleCount = await Ticket.countDocuments();

    // Obtener la última venta
    const lastSale = await Ticket.findOne<ITicket>().sort({ date: -1 }).lean();
    const lastSaleData = lastSale ? {
      profit: lastSale.totalProfit,
      timestamp: lastSale.date
    } : null;

    return NextResponse.json({
      totalProfit,
      saleCount,
      lastSale: lastSaleData
    });
  } catch (error) {
    console.error('Error al obtener los datos iniciales de ventas:', error);
    return NextResponse.json({ error: 'Error al obtener los datos iniciales de ventas' }, { status: 500 });
  }
}
