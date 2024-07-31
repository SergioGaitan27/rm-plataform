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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
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
          <h1 className="text-3xl font-bold text-center">Catálogo</h1>
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
                <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Código de caja:</span> {product.boxCode}</p>
                  <p><span className="font-semibold">Código de producto:</span> {product.productCode}</p>
                  <p><span className="font-semibold">Piezas por caja:</span> {product.piecesPerBox}</p>
                  <p><span className="font-semibold">Costo:</span> ${product.cost.toFixed(2)}</p>
                </div>
                <div className="mt-3">
                  <p className="font-semibold">Precios:</p>
                  <p>Menudeo: ${product.price1.toFixed(2)} (min. {product.price1MinQty})</p>
                  <p>Mayoreo: ${product.price2.toFixed(2)} (min. {product.price2MinQty})</p>
                  <p>Caja: ${product.price3.toFixed(2)} (min. {product.price3MinQty})</p>
                </div>
                <div className="mt-3">
                  <p className="font-semibold">Inventario:</p>
                  {product.stockLocations.map((location, index) => (
                    <p key={index}>{location.location}: {location.quantity}</p>
                  ))}
                </div>
                <Link href={`/administracion/productos/${product._id}`} className="mt-3 block text-center bg-yellow-400 text-black py-2 rounded hover:bg-yellow-300 transition-colors duration-300">
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