'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

type BottomNavBarProps = {
  categories: Category[];
};

const BottomNavBar = ({ categories }: BottomNavBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const routeMap: { [key: string]: string } = {
    'Dashboard': 'dashboard',
    'Créditos': 'creditos',
    'Catálogo': 'catalogo',
    'Administración': 'administracion',
    'Configuración': 'configuracion',
    'Punto de venta': 'punto-de-venta'
  };

  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = 0;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="bg-gray-900 fixed bottom-0 left-0 right-0 shadow-md">
      <div 
        ref={scrollRef}
        className="overflow-x-auto flex items-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex p-4 space-x-4">
          {categories.map((category, index) => (
            <Link
              href={`/${routeMap[category.name]}`}
              key={index}
              className="text-center text-yellow-400 hover:text-yellow-500 transition-colors flex flex-col items-center flex-shrink-0 min-w-[64px]"
            >
              <span className="text-3xl mb-1">{category.icon}</span>
              <span className="text-sm whitespace-nowrap">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBar;