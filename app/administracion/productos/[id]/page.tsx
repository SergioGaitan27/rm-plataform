'use client';

import { useRouter, useParams } from 'next/navigation';  // Cambiado a next/navigation
import { useEffect, useState } from 'react';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StockLocation {
  location: string;
  quantity: number;
}

interface Product {
  _id: string;
  name: string;
  boxCode: string;
  productCode: string;
  imageUrl?: string;
  stockLocations: StockLocation[];
}

const ProductDetail = () => {
  const router = useRouter();  // Utilizando el hook de next/navigation
  const { id } = useParams() as { id: string }; // Utilizando useParams para obtener los parámetros de la URL
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;

        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) {
          throw new Error('Error fetching product details');
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return <p className="text-yellow-400 text-center">Producto no encontrado</p>;
  }

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">{product.name}</h1>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
        {product.imageUrl && (
          <div className="relative w-full h-64 mb-4">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded"
            />
          </div>
        )}
        <div className="text-sm space-y-2">
          <p><span className="font-semibold">Código de Producto:</span> {product.productCode}</p>
          <p><span className="font-semibold">Código de Caja:</span> {product.boxCode}</p>
          <h2 className="text-xl font-bold mt-4 mb-2">Inventario Actual:</h2>
          {product.stockLocations.map((loc: StockLocation, index: number) => (
            <div key={index} className="mb-2">
              <p><span className="font-semibold">{loc.location}:</span> {loc.quantity}</p>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => router.push('/administracion/inventario/agregar')}
        className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
      >
        Regresar a Agregar Inventario
      </button>
    </div>
  );
};

export default ProductDetail;
