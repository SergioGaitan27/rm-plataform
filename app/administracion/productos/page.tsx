// app/administracion/productos/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProductAdminPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const categories = [
    { name: 'Crear producto', path: '/administracion/productos/crear', icon: '➕' },
    { name: 'Modificar producto', path: '/administracion/productos/modificar', icon: '✏️' },
    { name: 'Eliminar producto', path: '/administracion/productos/eliminar', icon: '🗑️' },
  ];

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Administración de Productos</h1>
        <div className="grid grid-cols-1 gap-4">
          {categories.map((category, index) => (
            <Link 
              href={category.path}
              key={index}
              className="bg-gray-900 p-4 rounded-lg text-center hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center"
            >
              <span className="text-3xl mr-4">{category.icon}</span>
              <span className="text-yellow-400 font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductAdminPage;