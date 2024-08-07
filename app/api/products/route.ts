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

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    if (code && type) {
      // Verificar existencia de código
      const query = type === 'boxCode' ? { boxCode: code } : { productCode: code };
      const existingProduct = await Product.findOne(query);
      return NextResponse.json({ exists: !!existingProduct });
    } else {
      // Obtener todos los productos
      const products = await Product.find({});
      return NextResponse.json(products);
    }
  } catch (error) {
    console.error('Error en la operación de productos:', error);
    return NextResponse.json({ error: 'Error en la operación de productos' }, { status: 500 });
  }
}