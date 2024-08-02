// app/api/products/[productId]/addStock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product'; // Asegúrate de tener este modelo definido

// Definir la interfaz para la ubicación del stock
interface StockLocation {
  location: string;
  quantity: number;
}

// Definir la interfaz para el producto
interface IProduct {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
  stockLocations: StockLocation[];
  imageUrl?: string;
}

export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  try {
    await connectDB();

    const { productId } = params;
    const body = await req.json();
    const { quantity, location } = body;

    if (!quantity || !location) {
      return NextResponse.json({ success: false, message: 'Datos no válidos' }, { status: 400 });
    }
    const numericQuantity = Number(quantity);

    if (isNaN(numericQuantity)) {
      return NextResponse.json({ success: false, message: 'La cantidad debe ser un número válido' }, { status: 400 });
    }

    const product = await Product.findById(productId) as IProduct | null;

    if (!product) {
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    const locationIndex = product.stockLocations.findIndex((loc: StockLocation) => loc.location === location);

    if (locationIndex === -1) {
      product.stockLocations.push({ location, quantity: numericQuantity });
    } else {
      product.stockLocations[locationIndex].quantity += numericQuantity;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { stockLocations: product.stockLocations },
      { new: true }
    );
    return NextResponse.json({
      success: true,
      message: 'Stock actualizado correctamente',
      data: updatedProduct
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      console.error("Error al actualizar el stock:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { productId: string } }) {
  try {
    await connectDB();
    const { productId } = params;

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json({ success: false, message: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      console.error("Error al buscar el producto:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}