// app/api/business-info/route.ts

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

export async function PUT(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    const { location } = data;

    const updatedBusinessInfo = await BusinessInfo.findOneAndUpdate(
      { location },
      data,
      { new: true, runValidators: true }
    );

    if (!updatedBusinessInfo) {
      return NextResponse.json({ error: 'Información de negocio no encontrada' }, { status: 404 });
    }

    return NextResponse.json(updatedBusinessInfo);
  } catch (error) {
    console.error('Error al actualizar la información del negocio:', error);
    return NextResponse.json({ error: 'Error al actualizar la información del negocio' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');

    if (!location) {
      return NextResponse.json({ error: 'Se requiere el parámetro de ubicación' }, { status: 400 });
    }

    const deletedBusinessInfo = await BusinessInfo.findOneAndDelete({ location });

    if (!deletedBusinessInfo) {
      return NextResponse.json({ error: 'Información de negocio no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Información de negocio eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la información del negocio:', error);
    return NextResponse.json({ error: 'Error al eliminar la información del negocio' }, { status: 500 });
  }
}