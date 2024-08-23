// app/api/business-info/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BusinessInfo from '@/models/BusinessInfo';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');

    if (!location) {
      return NextResponse.json({ error: 'Se requiere el parámetro de ubicación' }, { status: 400 });
    }

    const businessInfo = await BusinessInfo.findOne({ location });

    if (!businessInfo) {
      return NextResponse.json({ error: 'Información de negocio no encontrada' }, { status: 404 });
    }

    return NextResponse.json(businessInfo);
  } catch (error) {
    console.error('Error al obtener la información del negocio:', error);
    return NextResponse.json({ error: 'Error al obtener la información del negocio' }, { status: 500 });
  }
}