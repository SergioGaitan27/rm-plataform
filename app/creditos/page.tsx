'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BottomNavBar from '@/components/BottomNavBar';

const Creditos = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen bg-black">
      <p className="text-yellow-400 text-xl">Cargando...</p>
    </div>;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4">
        {/* Contenido principal de la página de Créditos */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 shadow-md">
          <h1 className="text-3xl font-bold mb-4">Créditos</h1>
          <p>Contenido específico para la categoría de Créditos.</p>
        </div>
      </div>
      <BottomNavBar />
    </div>
  );
};

export default Creditos;
