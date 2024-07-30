'use client';

import Link from 'next/link';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

type BottomNavBarProps = {
  categories: Category[];
};

const BottomNavBar = ({ categories }: BottomNavBarProps) => {
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
        {categories.map((category, index) => (
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
