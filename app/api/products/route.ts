// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const newProduct = new Product(body);
    await newProduct.save();
    return NextResponse.json({ message: 'Producto guardado exitosamente', product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error al guardar el producto:', error);
    return NextResponse.json({ error: 'Error al guardar el producto' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({});
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    return NextResponse.json({ error: 'Error al obtener los productos' }, { status: 500 });
  }
}