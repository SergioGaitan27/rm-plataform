'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const Catalogo = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCategories([
        { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
        { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
        { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
        { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
        { name: 'Configuración', allowedRoles: ['super_administrador', 'administrador'], icon: '🔧' },
      ]);
      setLoading(false);
    };

    if (status === 'authenticated') {
      fetchCategories();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const userRole = session.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4">
        {/* Contenido principal de la página de Catálogo */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 shadow-md">
          <h1 className="text-3xl font-bold mb-4">Catálogo</h1>
          <p>Contenido específico para la categoría de Catálogo.</p>
        </div>
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

export default Catalogo;
