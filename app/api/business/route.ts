// app/api/business/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BusinessInfo from '@/models/BusinessInfo';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');

    if (location) {
      const businessInfo = await BusinessInfo.findOne({ location });

      if (!businessInfo) {
        return NextResponse.json({ error: 'Información de negocio no encontrada' }, { status: 404 });
      }

      return NextResponse.json(businessInfo);
    } else {
      // Si no se proporciona ubicación, devolver todos los negocios
      const allBusinesses = await BusinessInfo.find({});
      return NextResponse.json(allBusinesses);
    }
  } catch (error) {
    console.error('Error al obtener la información del negocio:', error);
    return NextResponse.json({ error: 'Error al obtener la información del negocio' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    const newBusinessInfo = new BusinessInfo(data);
    await newBusinessInfo.save();

    return NextResponse.json(newBusinessInfo, { status: 201 });
  } catch (error) {
    console.error('Error al crear la información del negocio:', error);
    return NextResponse.json({ error: 'Error al crear la información del negocio' }, { status: 500 });
  }
}