'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FaDoorOpen } from 'react-icons/fa';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const Dashboard = () => {
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

    fetchCategories();
  }, []);

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center h-screen bg-black">
      <p className="text-yellow-400 text-xl">Cargando...</p>
    </div>;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const userRole = session.user?.role;

  const userCategories = categories.filter(category => 
    category.allowedRoles.includes(userRole as string)
  );

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <div className="max-w-md mx-auto">
        {/* Perfil del usuario */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 shadow-md">
          <div className="flex items-center mb-4">
            <Image
              src={session.user.image || '/images/default-avatar.png'}
              alt="Perfil"
              width={80}
              height={80}
              className="rounded-full mr-4"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-yellow-400">{session.user.name || 'Usuario'}</h1>
              <p className="text-sm text-yellow-300">{userRole || 'Sin rol'}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center text-yellow-400 hover:text-yellow-500 transition-colors ml-4"
              title="Cerrar Sesión"
            >
              <FaDoorOpen size={32} />
            </button>
          </div>
          <div className="space-y-2">
            <p><span className="font-semibold">Email:</span> {session.user.email}</p>
            <p><span className="font-semibold">ID:</span> {session.user.id}</p>
            <p><span className="font-semibold">Teléfono:</span> {session.user.phone || 'No disponible'}</p>
            {/* Puedes agregar más campos aquí según la información disponible en la sesión */}
          </div>
        </div>
        {/* Categorías */}
        <h2 className="text-xl font-semibold mb-4">Categorías</h2>
        <div className="grid grid-cols-2 gap-4">
          {userCategories.map((category, index) => (
            <Link 
              href={`/dashboard/${category.name.toLowerCase().replace(' ', '-')}`} 
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

export default Dashboard;
