'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const ProductAdminPage = () => {
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
        { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
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

  const productCategories = [
    { name: 'Crear producto', path: '/administracion/productos/crear', icon: '🆕' },
    { name: 'Modificar producto', path: '/bajo-construccion', icon: '✏️' },
    { name: 'Eliminar producto', path: '/bajo-construccion', icon: '🗑️' },
    { name: 'Transferencias', path: '/transferencias', icon: '↔️' }, // Nueva categoría añadida
  ];

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4">
        {/* Título de la página */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center mb-4">Administración de Productos</h1>
        </div>

        {/* Categorías de productos */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <div className="grid grid-cols-2 gap-4">
            {productCategories.map((category, index) => (
              <Link 
                href={category.path}
                key={index}
                className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition-colors shadow-md flex flex-col items-center justify-center"
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="text-yellow-400 font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

export default ProductAdminPage;