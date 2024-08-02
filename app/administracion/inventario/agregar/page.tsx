// app/administracion-inventario/agregar/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

interface Product {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
  stockLocations: {
    location: string;
    quantity: number;
  }[];
  imageUrl?: string;
}

const AgregarInventario: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    const filtered = products.filter(product =>
      product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const handleNavigateToProductPage = (productId: string) => {
    router.push(`/administracion/inventario/agregar/${productId}`);
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center">Agregar Inventario</h1>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <input
            type="text"
            placeholder="Buscar por código de caja, código de producto o nombre"
            className="w-full p-2 mb-4 bg-gray-800 text-yellow-400 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-gray-800 p-4 rounded-lg shadow"
              >
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
                <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                <div className="space-y-1 text-base">
                  <p><span className="font-semibold">Código de caja:</span> {product.boxCode}</p>
                  <p><span className="font-semibold">Código de producto:</span> {product.productCode}</p>
                  <p><span className="font-semibold">Piezas por caja:</span> {product.piecesPerBox}</p>
                  <h3 className="font-semibold mt-2">Stock:</h3>
                  {product.stockLocations.map((loc, index) => (
                    <p key={index}>{loc.location}: {loc.quantity}</p>
                  ))}
                </div>

                <button
                  onClick={() => handleNavigateToProductPage(product._id)}
                  className="mt-3 w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
                >
                  Agregar Inventario
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNavBar categories={[]} />
    </div>
  );
};

export default AgregarInventario;