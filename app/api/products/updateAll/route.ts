// app/api/products/updateAll/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export async function PUT(req: Request) {
  console.log("Iniciando actualización masiva de ubicaciones");
  try {
    await connectDB();
    console.log("Conexión a la base de datos establecida");
    
    const newLocations = [
      { location: "L120", quantity: 100000 },
      { location: "L123", quantity: 100000 },
      { location: "L144", quantity: 100000 },
      { location: "L152", quantity: 100000 }
    ];

    console.log("Iniciando actualización en la base de datos");
    const result = await Product.updateMany(
      {}, 
      {
        $set: {
          stockLocations: newLocations
        }
      }
    );
    console.log("Actualización completada", result);

    return NextResponse.json({ 
      success: true,
      message: `Ubicaciones actualizadas en ${result.modifiedCount} productos.`,
      result
    });
  } catch (error) {
    console.error('Error detallado al actualizar las ubicaciones de los productos:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error al actualizar las ubicaciones de los productos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}