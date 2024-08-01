'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

interface Container {
  _id: string;
  containerNumber: string;
  products: Array<{ name: string; code: string; boxes: number }>;
  status: 'preloaded' | 'received' | 'completed';
}

const ContainerReceptionPage = () => {
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
    setIsLoading(true);
    try {
      const response = await fetch('/api/containers?status=preloaded');
      if (!response.ok) throw new Error('Failed to fetch containers');
      const data = await response.json();
      setContainers(data.data);
    } catch (error) {
      console.error('Error fetching containers:', error);
      setError('Error al cargar los contenedores');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) return <LoadingSpinner />;
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
              <Link href={`/administracion/contenedores/recepcion/${container.containerNumber}`}>
                <div className="cursor-pointer">
                  <h2 className="text-xl font-semibold mb-2">Contenedor: {container.containerNumber}</h2>
                  <p>Productos: {container.products.length}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <BottomNavBar categories={[]} />
    </div>
  );
};

export default ContainerReceptionPage;
