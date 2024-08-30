// app/api/reportes/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Corte from '@/models/Corte';

export async function GET() {
  try {
    await connectDB();

    const cortes = await Corte.find().sort({ date: -1 }).limit(30);  // Obtener los últimos 30 cortes

    return NextResponse.json(cortes);
  } catch (error) {
    console.error('Error al obtener los cortes:', error);
    return NextResponse.json({ error: 'Error al obtener los cortes' }, { status: 500 });
  }
}