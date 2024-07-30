// app/administracion/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

const AdminPage = () => {
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
    { name: 'Clientes', path: '/administracion/clientes', icon: '👥' },
    { name: 'Productos', path: '/administracion/productos', icon: '📦' },
    { name: 'Negocios', path: '/administracion/negocios', icon: '🏢' },
  ];

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Administración</h1>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <Link 
              href={category.path}
              key={index}
              className="bg-gray-900 p-4 rounded-lg text-center hover:bg-gray-800 transition-colors shadow-md flex flex-col items-center justify-center"
            >
              <span className="text-3xl mb-2">{category.icon}</span>
              <span className="text-yellow-400 font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;