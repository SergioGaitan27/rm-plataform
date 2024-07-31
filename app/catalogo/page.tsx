'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

interface Product {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
  cost: number;
  price1: number;
  price1MinQty: number;
  price2: number;
  price2MinQty: number;
  price3: number;
  price3MinQty: number;
  price4?: number;
  price5?: number;
  stockLocations: {
    location: string;
    quantity: number;
  }[];
  imageUrl?: string;
}

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const ProductCatalog: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

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

    const fetchCategories = async () => {
      setCategories([
        { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
        { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
        { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
        { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
        { name: 'Configuración', allowedRoles: ['super_administrador', 'administrador'], icon: '🔧' },
        { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
      ]);
    };

    if (status === 'authenticated') {
      fetchProducts();
      fetchCategories();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const userRole = session?.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center">Catálogo de Productos</h1>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product._id} className="bg-gray-800 p-4 rounded-lg shadow">
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
                <p><strong>Código de caja:</strong> {product.boxCode}</p>
                <p><strong>Código de producto:</strong> {product.productCode}</p>
                <p><strong>Piezas por caja:</strong> {product.piecesPerBox}</p>
                <p><strong>Costo:</strong> ${product.cost.toFixed(2)}</p>
                <p><strong>Precio menudeo:</strong> ${product.price1.toFixed(2)} | A partir de: {product.price1MinQty}</p>
                <p><strong>Precio mayoreo:</strong> ${product.price2.toFixed(2)} | A partir de: {product.price2MinQty}</p>
                <p><strong>Precio caja:</strong> ${product.price3.toFixed(2)} | A partir de: {product.price3MinQty}</p>
                {product.price4 && <p><strong>Precio 4:</strong> ${product.price4.toFixed(2)}</p>}
                {product.price5 && <p><strong>Precio 5:</strong> ${product.price5.toFixed(2)}</p>}
                <h3 className="mt-2 font-semibold">Stock:</h3>
                <ul>
                  {product.stockLocations.map((location, index) => (
                    <li key={index}>
                      <strong>{location.location}:</strong> {location.quantity}
                    </li>
                  ))}
                </ul>
                <Link href={`/administracion/productos/${product._id}`} className="text-yellow-400 hover:text-yellow-300 mt-2 inline-block">
                  Ver detalles
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

export default ProductCatalog;
