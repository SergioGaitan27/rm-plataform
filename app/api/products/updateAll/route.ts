import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export async function PUT(req: Request) {
  try {
    await connectDB();
    
    const result = await Product.updateMany(
      {}, // Este filtro vacío selecciona todos los documentos
      {
        $set: {
          price1: 100,
          price1MinQty: 1,
          price2: 90,
          price2MinQty: 3,
          price3: 80,
          price3MinQty: 100,
          price4: 50,
          price5: 30,
          cost: 10,
          category: "Sin categoría",
          availability: true
        }
      }
    );

    return NextResponse.json({ 
      message: `${result.modifiedCount} productos actualizados exitosamente`,
      result 
    });
  } catch (error) {
    console.error('Error al actualizar los productos:', error);
    return NextResponse.json({ error: 'Error al actualizar los productos' }, { status: 500 });
  }
}