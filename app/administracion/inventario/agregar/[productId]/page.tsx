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

const AgregarStockProducto: React.FC<{ params: { productId: string } }> = ({ params }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.productId}`);
        if (!response.ok) {
          throw new Error('Error fetching product');
        }
        const data = await response.json();
        setProduct(data.data);
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Error al cargar el producto. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchProduct();
    }
  }, [status, params.productId]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const handleAddStock = async () => {
    try {
        const numericQuantity = parseInt(quantity, 10);
        if (isNaN(numericQuantity)) {
          setErrorMessage('Por favor, ingrese una cantidad válida.');
          return;
        }
    
        const response = await fetch(`/api/products/${params.productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: numericQuantity, location }),
        });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error adding stock');
      }

      setProduct(result.data);
      setQuantity('');
      setLocation('');
      setErrorMessage('');
      setIsSuccessful(true);
      setTimeout(() => {
        setIsSuccessful(false);
        router.push('/administracion/inventario/agregar');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error al agregar stock. Por favor, intente de nuevo.');
    }
  };

  const handleAddNewLocation = () => {
    if (newLocation && product) {
      const updatedProduct = {
        ...product,
        stockLocations: [...product.stockLocations, { location: newLocation, quantity: 0 }]
      };
      setProduct(updatedProduct);
      setLocation(newLocation);
      setNewLocation('');
      setIsAddingNewLocation(false);
    }
  };

  if (!product) {
    return <div>Producto no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center">Agregar Stock: {product.name}</h1>
        </div>

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
          <div className="space-y-2">
            <p><span className="font-semibold">Código de caja:</span> {product.boxCode}</p>
            <p><span className="font-semibold">Código de producto:</span> {product.productCode}</p>
            <p><span className="font-semibold">Piezas por caja:</span> {product.piecesPerBox}</p>
            <h3 className="font-semibold mt-4">Stock actual:</h3>
            {product.stockLocations.map((loc, index) => (
              <p key={index}>{loc.location}: {loc.quantity}</p>
            ))}
          </div>

          <div className="mt-6">
            <select
              value={location}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setIsAddingNewLocation(true);
                } else {
                  setLocation(e.target.value);
                }
              }}
              className="w-full p-2 mb-4 bg-gray-800 text-yellow-400 rounded"
            >
              <option value="">Seleccione ubicación</option>
              {product.stockLocations.map((loc, index) => (
                <option key={index} value={loc.location}>
                  {loc.location}
                </option>
              ))}
              <option value="new">+ Agregar nueva ubicación</option>
            </select>
            <input
              type="number"
              placeholder="Cantidad a agregar"
              className="w-full p-2 mb-4 bg-gray-800 text-yellow-400 rounded"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <button
              onClick={handleAddStock}
              className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Agregar Stock
            </button>
            {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
          </div>
        </div>
      </div>

      {isAddingNewLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg border border-yellow-400 w-3/4 max-w-md">
            <h3 className="text-xl font-semibold mb-4">Agregar nueva ubicación</h3>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Nueva ubicación"
              className="w-full p-2 mb-4 bg-gray-800 border border-yellow-400 rounded text-yellow-400"
            />
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleAddNewLocation}
                className="bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNewLocation(false)}
                className="bg-gray-600 text-yellow-400 p-2 rounded hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuccessful && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-green-500 text-xl font-bold">¡Stock actualizado correctamente!</p>
          </div>
        </div>
      )}

      <BottomNavBar categories={[]} />
    </div>
  );
};

export default AgregarStockProducto;