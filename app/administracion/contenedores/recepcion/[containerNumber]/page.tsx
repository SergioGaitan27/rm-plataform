'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaPlus, FaMinus, FaBarcode } from 'react-icons/fa';

interface Product {
  name: string;
  code: string;
  boxes: number;
  receivedBoxes?: number;
}

interface Container {
  _id: string;
  containerNumber: string;
  products: Product[];
  status: 'preloaded' | 'received' | 'completed';
}

export default function ContainerDetails({ params }: { params: { containerNumber: string } }) {
  const router = useRouter();
  const [container, setContainer] = useState<Container | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContainerDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/containers/${params.containerNumber}`);
      if (!response.ok) throw new Error('Failed to fetch container details');
      const data = await response.json();
      setContainer({
        ...data.data,
        products: data.data.products.map((p: Product) => ({ ...p, receivedBoxes: 0 }))
      });
    } catch (error) {
      console.error('Error fetching container details:', error);
      setError('Error al cargar los detalles del contenedor');
    } finally {
      setIsLoading(false);
    }
  }, [params.containerNumber]);

  useEffect(() => {
    fetchContainerDetails();
  }, [fetchContainerDetails]);

  const handleBoxCountChange = (index: number, change: number) => {
    if (!container) return;
    const newProducts = [...container.products];
    newProducts[index].receivedBoxes = Math.max(0, (newProducts[index].receivedBoxes || 0) + change);
    setContainer({ ...container, products: newProducts });
  };

  const getTotalBoxes = () => {
    if (!container) return { expected: 0, received: 0 };
    return container.products.reduce(
      (acc, product) => ({
        expected: acc.expected + product.boxes,
        received: acc.received + (product.receivedBoxes || 0)
      }),
      { expected: 0, received: 0 }
    );
  };

  const handleSubmit = async () => {
    if (!container) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/containers/${params.containerNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'received' }),
      });
  
      if (!response.ok) throw new Error('Failed to update container status');
  
      const result = await response.json();
      alert(result.message); // Muestra el mensaje de confirmación
      router.push('/administracion/contenedores/recepcion');
    } catch (error) {
      console.error('Error receiving container:', error);
      setError('Error al recibir el contenedor');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!container) return <div>No se encontró el contenedor</div>;

  const totalBoxes = getTotalBoxes();
  const progress = (totalBoxes.received / totalBoxes.expected) * 100;

  const filteredProducts = container.products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
        <h1 className="text-3xl font-bold text-center">Recepción del Contenedor: {container.containerNumber}</h1>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xl">Total de cajas esperadas: <span className="font-bold">{totalBoxes.expected}</span></p>
            <p className="text-xl">Total de cajas recibidas: <span className="font-bold">{totalBoxes.received}</span></p>
          </div>
          <div className="w-1/3">
            <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full ${progress >= 100 ? 'bg-green-500' : progress > 0 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-center mt-2">{progress.toFixed(1)}% completado</p>
          </div>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            className="w-full p-2 border rounded bg-gray-800 text-yellow-400 border-yellow-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ul className="space-y-4 mb-20">
        {filteredProducts.map((product, index) => (
          <li key={product.code} className="bg-gray-900 rounded-lg p-4 shadow-md border border-yellow-400">
              <div className="flex flex-col mb-4">
                <h2 className="text-xl font-semibold text-yellow-400">{product.name}</h2>
                <span className="text-base text-gray-400">Código: {product.code}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                <div>
                  <p className="text-base text-gray-400">Cajas esperadas: <span className="font-bold text-yellow-400">{product.boxes}</span></p>
                  <p className="text-base text-gray-400">Cajas recibidas: <span className="font-bold text-yellow-400">{product.receivedBoxes || 0}</span></p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBoxCountChange(index, -1)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <FaMinus />
                  </button>
                  <span className="text-2xl font-bold text-yellow-400">{product.receivedBoxes || 0}</span>
                  <button
                    onClick={() => handleBoxCountChange(index, 1)}
                    className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            </li>
        ))}
      </ul>
      
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 shadow-md p-4">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-yellow-400 text-black p-3 rounded-lg text-lg font-bold hover:bg-yellow-500 transition-colors"
        >
          {isLoading ? 'Procesando...' : 'Confirmar Recepción'}
        </button>
      </div>
    </div>
  );
}