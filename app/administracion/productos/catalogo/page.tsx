'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Product {
  _id: string;
  name: string;
  productCode: string;
  price1: number;
  imageUrl?: string;
}

const ProductCatalog: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Error fetching products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
        <Link href="/administracion/productos/crear" className="bg-yellow-400 text-black px-4 py-2 rounded mb-4 inline-block">
          Crear Nuevo Producto
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product._id} className="bg-gray-900 p-4 rounded-lg shadow">
              {product.imageUrl && (
                <div className="relative w-full h-48 mb-2">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded"
                  />
                </div>
              )}
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p>Código: {product.productCode}</p>
              <p>Precio: ${product.price1.toFixed(2)}</p>
              <Link href={`/administracion/productos/${product._id}`} className="text-yellow-400 hover:text-yellow-300 mt-2 inline-block">
                Ver detalles
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;