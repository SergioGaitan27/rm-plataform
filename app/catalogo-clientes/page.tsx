'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Product {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
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

const ProductCatalog: React.FC = () => {
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
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product => 
      (product.boxCode?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.productCode?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center">Catálogo de Productos</h1>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <input
            type="text"
            placeholder="Buscar por código de caja, código de producto o nombre"
            className="w-full p-2 mb-4 bg-gray-800 text-yellow-400 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-20">
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
                </div>
                <div className="mt-3">
                  <p className="font-semibold">Precios:</p>
                  <p>Menudeo: ${product.price1.toFixed(2)} | A partir de: {product.price1MinQty}</p>
                  <p>Mayoreo: ${product.price2.toFixed(2)} | A partir de: {product.price2MinQty}</p>
                  <p>Caja: ${product.price3.toFixed(2)} | A partir de: {product.price3MinQty}</p>
                </div>
                <div className="mt-3">
                  <p className="font-semibold">Inventario total:</p>
                  <p>{product.stockLocations.reduce((total, location) => total + location.quantity, 0)} unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;