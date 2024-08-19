import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export async function PUT(req: Request) {
  try {
    await connectDB();
    
    // Primero, actualizamos los campos básicos
    const result = await Product.updateMany(
      {}, 
      {
        $set: {
          price1: 100,
          price1MinQty: 1,
          price2: 90,
          price2MinQty: 3,
          price3: 80,
          price4: 50,
          price5: 30,
          cost: 10,
          category: "Sin categoría",
          availability: true
        }
      }
    );

    // Ahora, actualizamos price3MinQty y recalculamos quantity en las ubicaciones
    const complexUpdateResult = await Product.updateMany(
      {},
      [
        {
          $set: {
            price3MinQty: "$piecesPerBox",
            stockLocations: {
              $map: {
                input: "$stockLocations",
                as: "location",
                in: {
                  location: "$$location.location",
                  quantity: { $multiply: ["$piecesPerBox", "$$location.quantity"] }
                }
              }
            }
          }
        }
      ]
    );

    return NextResponse.json({ 
      message: `${result.modifiedCount} productos actualizados exitosamente. 
                price3MinQty y cantidades en ubicaciones actualizadas en ${complexUpdateResult.modifiedCount} productos.`,
      result,
      complexUpdateResult
    });
  } catch (error) {
    console.error('Error al actualizar los productos:', error);
    return NextResponse.json({ error: 'Error al actualizar los productos' }, { status: 500 });
  }
}