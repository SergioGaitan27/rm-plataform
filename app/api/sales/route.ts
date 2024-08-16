// app/api/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product, { IProduct, IStockLocation } from '@/models/Product';

interface CartItem {
  _id: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
}

interface SaleData {
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card';
  amountPaid: number;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body: SaleData = await req.json();
    const { items, totalAmount, paymentMethod, amountPaid } = body;

    // Validate the sale data
    if (!items || items.length === 0 || !totalAmount || !paymentMethod) {
      return NextResponse.json({ success: false, message: 'Datos de venta inválidos' }, { status: 400 });
    }

    // Process each item in the cart
    for (const item of items) {
      const product = await Product.findById(item._id) as IProduct | null;
      if (!product) {
        return NextResponse.json({ success: false, message: `Producto no encontrado: ${item._id}` }, { status: 404 });
      }

      const quantityToReduce = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;

      // Calculate the total quantity in stock
      const totalStock = product.stockLocations.reduce((sum: number, location: IStockLocation) => sum + location.quantity, 0);

      if (totalStock < quantityToReduce) {
        return NextResponse.json({ success: false, message: `Stock insuficiente para ${product.name}` }, { status: 400 });
      }

      // Reduce stock from locations
      let remainingQuantity = quantityToReduce;
      for (const location of product.stockLocations) {
        if (remainingQuantity <= 0) break;

        if (location.quantity >= remainingQuantity) {
          location.quantity -= remainingQuantity;
          remainingQuantity = 0;
        } else {
          remainingQuantity -= location.quantity;
          location.quantity = 0;
        }
      }

      // Remove locations with zero quantity
      product.stockLocations = product.stockLocations.filter((loc: IStockLocation) => loc.quantity > 0);

      // Update the product in the database
      await Product.findByIdAndUpdate(item._id, { stockLocations: product.stockLocations });
    }

    // Here you would typically save the sale to a Sales collection
    // For this example, we'll just return a success message

    return NextResponse.json({
      success: true,
      message: 'Venta procesada exitosamente',
      data: {
        totalAmount,
        paymentMethod,
        amountPaid,
        change: paymentMethod === 'cash' ? amountPaid - totalAmount : 0
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      console.error("Error al procesar la venta:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}