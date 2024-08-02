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

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const ContainerReceptionPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const initialize = async () => {
      if (status === 'authenticated') {
        await Promise.all([fetchContainers(), fetchCategories()]);
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    initialize();
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

  const fetchCategories = async () => {
    // Simulando una llamada a la API con setTimeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCategories([
      { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
      { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
      { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
      { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
      { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
    ]);
    setIsLoading(false);
  };

  if (status === 'loading' || isLoading) return <LoadingSpinner />;
  if (!session) return null;

  const userRole = session.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4 flex-grow">
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
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

export default ContainerReceptionPage;