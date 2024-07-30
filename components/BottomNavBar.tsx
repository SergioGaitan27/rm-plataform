'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const BottomNavBar = () => {
  const { data: session, status } = useSession();
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
    return null;
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

  const userRole = session.user?.role;

  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  const routeMap: { [key: string]: string } = {
    'Créditos': 'creditos',
    'Catálogo': 'catalogo',
    'Administración': 'administracion',
    'Configuración': 'configuracion',
    'Punto de venta': 'punto-de-venta'
  };

  return (
    <nav className="bg-gray-900 p-4 fixed bottom-0 left-0 right-0 shadow-md">
      <div className="flex justify-around">
        {userCategories.map((category, index) => (
          <Link
            href={`/${routeMap[category.name]}`}
            key={index}
            className="text-center text-yellow-400 hover:text-yellow-500 transition-colors flex flex-col items-center"
          >
            <span className="text-3xl mb-1">{category.icon}</span>
            <span className="text-sm">{category.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
