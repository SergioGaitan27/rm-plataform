// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const productData: any = {};

    // Function to handle file upload
    const uploadFile = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result?.secure_url || '');
          }
        );

        uploadStream.end(buffer);
      });
    };

    // Extract all form fields
    for (const [key, value] of formData.entries()) {
      if (key === 'image' && value instanceof File) {
        // Handle image upload to Cloudinary
        productData.imageUrl = await uploadFile(value);
      } else if (key === 'stockLocations') {
        // Parse JSON string back to object
        productData[key] = JSON.parse(value as string);
      } else {
        productData[key] = value;
      }
    }

    // Convert numeric fields
    const numericFields = ['piecesPerBox', 'cost', 'price1', 'price1MinQty', 'price2', 'price2MinQty', 'price3', 'price3MinQty', 'price4', 'price5'];
    numericFields.forEach(field => {
      if (productData[field]) {
        productData[field] = Number(productData[field]);
      }
    });

    // Ensure required fields are present
    const requiredFields = ['boxCode', 'productCode', 'name', 'piecesPerBox', 'cost', 'price1', 'price1MinQty', 'price2', 'price2MinQty', 'price3', 'price3MinQty'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json({ error: `El campo ${field} es requerido` }, { status: 400 });
      }
    }

    const newProduct = new Product(productData);
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