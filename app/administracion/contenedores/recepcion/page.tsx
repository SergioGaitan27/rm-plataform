'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Container {
  _id: string;
  containerNumber: string;
  products: Array<{ name: string; code: string; boxes: number }>;
  status: 'preloaded' | 'received' | 'completed';
}

const RecepcionContenedor = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchContainers();
    }
  }, [status, router]);

  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/containers?status=preloaded');
      if (!response.ok) throw new Error('Failed to fetch containers');
      const data = await response.json();
      setContainers(data.data);
    } catch (error) {
      console.error('Error fetching containers:', error);
      setError('Error al cargar los contenedores');
    }
  };

  const handleReceiveContainer = async (containerNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/containers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerNumber, status: 'received' }),
      });

      if (!response.ok) throw new Error('Failed to update container status');

      setContainers(containers.filter(c => c.containerNumber !== containerNumber));
      alert('Contenedor recibido exitosamente');
    } catch (error) {
      console.error('Error receiving container:', error);
      setError('Error al recibir el contenedor');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') return <LoadingSpinner />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <h1 className="text-3xl font-bold mb-6">Recepción de Contenedores</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {containers.length === 0 ? (
        <p>No hay contenedores pendientes de recepción.</p>
      ) : (
        <ul className="space-y-4">
          {containers.map((container) => (
            <li key={container._id} className="bg-gray-900 rounded-lg p-4 border border-yellow-400">
              <h2 className="text-xl font-semibold mb-2">Contenedor: {container.containerNumber}</h2>
              <p>Productos: {container.products.length}</p>
              <button
                onClick={() => handleReceiveContainer(container.containerNumber)}
                disabled={isLoading}
                className="mt-2 bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
              >
                {isLoading ? 'Procesando...' : 'Marcar como Recibido'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecepcionContenedor;