// app/api/transfers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product, { IProduct, IStockLocation } from '@/models/Product';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { productId, fromLocation, toLocation, quantity } = body;

    const product = await Product.findById(productId) as IProduct | null;

    if (!product) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }

    const fromLocationIndex = product.stockLocations.findIndex((loc: IStockLocation) => loc.location === fromLocation);
    const toLocationIndex = product.stockLocations.findIndex((loc: IStockLocation) => loc.location === toLocation);

    if (fromLocationIndex === -1) {
      return NextResponse.json({ message: 'Ubicación de origen no encontrada' }, { status: 400 });
    }

    if (product.stockLocations[fromLocationIndex].quantity < quantity) {
      return NextResponse.json({ message: 'Cantidad insuficiente en la ubicación de origen' }, { status: 400 });
    }

    // Restar de la ubicación de origen
    product.stockLocations[fromLocationIndex].quantity -= quantity;

    // Añadir a la ubicación de destino
    if (toLocationIndex !== -1) {
      product.stockLocations[toLocationIndex].quantity += quantity;
    } else {
      product.stockLocations.push({ location: toLocation, quantity });
    }

    // Eliminar ubicaciones con cantidad 0
    product.stockLocations = product.stockLocations.filter((loc: IStockLocation) => loc.quantity > 0);

    await product.save();

    return NextResponse.json({ message: 'Transferencia realizada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('Error en la transferencia:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}