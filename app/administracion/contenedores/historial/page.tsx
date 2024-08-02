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
  status: 'preloaded' | 'received' | 'completed';
  totalExpectedBoxes: number;
  totalReceivedBoxes: number;
  updatedAt: string;
}

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const HistorialContenedores = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const initialize = async () => {
      if (status === 'authenticated') {
        try {
          await Promise.all([fetchContainers(), fetchCategories()]);
        } catch (error) {
          console.error('Error initializing data:', error);
          setError('Error al cargar los datos');
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    initialize();
  }, [status, router]);

  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/containers?status=received');
      if (!response.ok) throw new Error('Failed to fetch containers');
      const data = await response.json();
      setContainers(data.data);
    } catch (error) {
      console.error('Error fetching containers:', error);
      throw new Error('Error al cargar el historial de contenedores');
    }
  };

  const fetchCategories = async () => {
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCategories([
      { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
      { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
      { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
      { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
    ]);
  };

  if (status === 'loading' || isLoading) return <LoadingSpinner />;
  if (!session) return null;

  const sortedContainers = [...containers].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const completedContainers = sortedContainers.filter(c => c.totalExpectedBoxes === c.totalReceivedBoxes);
  const incompleteContainers = sortedContainers.filter(c => c.totalExpectedBoxes !== c.totalReceivedBoxes);

  const userRole = session.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4 pb-24">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center mb-4">Historial de Contenedores</h1>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {containers.length === 0 ? (
          <p>No hay contenedores recibidos en el historial.</p>
        ) : (
          <>
            <ContainerList title="Contenedores Completos" containers={completedContainers} />
            <ContainerList title="Contenedores Incompletos" containers={incompleteContainers} />
          </>
        )}
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

const ContainerList = ({ title, containers }: { title: string, containers: Container[] }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-semibold mb-4 text-yellow-400">{title}</h2>
    {containers.length === 0 ? (
      <p>No hay contenedores en esta categoría.</p>
    ) : (
      <ul className="space-y-4">
        {containers.map((container) => (
          <li key={container._id} className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">Contenedor: {container.containerNumber}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Estado:" value="Recibido" />
              <InfoItem label="Fecha de recepción:" value={new Date(container.updatedAt).toLocaleString()} />
              <InfoItem label="Total de cajas esperadas:" value={container.totalExpectedBoxes.toString()} />
              <InfoItem label="Total de cajas recibidas:" value={container.totalReceivedBoxes.toString()} />
            </div>
            <Link 
              href={`/administracion/contenedores/historial/${container.containerNumber}`}
              className="mt-4 inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition-colors"
            >
              Ver detalles
            </Link>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-gray-400 text-xs">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default HistorialContenedores;