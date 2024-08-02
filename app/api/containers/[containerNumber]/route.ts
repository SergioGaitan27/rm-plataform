import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Container, { IProduct } from '@/models/containerModel';

export async function GET(req: NextRequest, { params }: { params: { containerNumber: string } }) {
  try {
    await connectDB();

    const { containerNumber } = params;

    const container = await Container.findOne({ containerNumber });

    if (!container) {
      return NextResponse.json({ success: false, message: 'Contenedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: container }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error al buscar el contenedor:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { containerNumber: string } }) {
  try {
    await connectDB();

    const { containerNumber } = params;
    const body = await req.json();

    if (body.status !== 'received' || !Array.isArray(body.products)) {
      return NextResponse.json({ success: false, message: 'Datos no válidos' }, { status: 400 });
    }

    const updatedProducts: IProduct[] = body.products.map((product: any) => {
      const expectedBoxes = parseInt(product.expectedBoxes, 10);
      const receivedBoxes = parseInt(product.receivedBoxes, 10) || 0;

      if (isNaN(expectedBoxes)) {
        throw new Error(`Valor inválido para expectedBoxes en el producto ${product.name}: ${product.expectedBoxes}`);
      }

      return {
        name: product.name,
        code: product.code,
        expectedBoxes,
        receivedBoxes
      };
    });

    const totalExpectedBoxes = updatedProducts.reduce((sum: number, product: IProduct) => sum + product.expectedBoxes, 0);
    const totalReceivedBoxes = updatedProducts.reduce((sum: number, product: IProduct) => sum + product.receivedBoxes, 0);

    const updatedContainer = await Container.findOneAndUpdate(
      { containerNumber },
      { 
        $set: { 
          status: 'received',
          products: updatedProducts,
          totalExpectedBoxes,
          totalReceivedBoxes
        }
      },
      { new: true }
    );

    if (!updatedContainer) {
      return NextResponse.json({ success: false, message: 'Contenedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contenedor recibido correctamente',
      data: updatedContainer
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      console.error("Error al actualizar el contenedor:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}