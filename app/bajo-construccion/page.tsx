'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

const UnderConstruction: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const userRole = session?.user?.role;
  const categories = [
    { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
    { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
    { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
    { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
    { name: 'Configuración', allowedRoles: ['super_administrador', 'administrador'], icon: '🔧' },
    { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
  ];

  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg p-8 shadow-md text-center max-w-lg w-full">
          <h1 className="text-4xl font-bold mb-6">Página en Construcción</h1>
          <div className="text-6xl mb-6">🚧</div>
          <p className="text-xl mb-4">
            Estamos trabajando arduamente para mejorar esta sección.
          </p>
          <p className="text-lg">
            Por favor, vuelve pronto para ver las nuevas funcionalidades.
          </p>
        </div>
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

export default UnderConstruction;