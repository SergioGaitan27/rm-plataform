import React from 'react';
import Link from 'next/link';
import { Home, ShoppingCart, CreditCard, Book, Settings, BarChart2 } from 'lucide-react';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
  path: string;
};

type SideNavBarProps = {
  categories: Category[];
  isOpen: boolean;
  onToggle: () => void;  // Añadimos esta línea
};

const iconMap = {
  '💰': ShoppingCart,
  '💳': CreditCard,
  '📚': Book,
  '⚙️': Settings,
  '🗂️': BarChart2,
};

const SideNavBar: React.FC<SideNavBarProps> = ({ categories, isOpen, onToggle }) => {
  return (
    <>
      <nav 
        className={`bg-gray-900 fixed top-0 left-0 bottom-0 w-64 shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } z-50`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <Link href="/" className="text-yellow-400 hover:text-yellow-500 transition-colors flex items-center">
            <span className="text-lg font-semibold">Categorías</span>
          </Link>
        </div>
        <div className="overflow-y-auto h-full flex flex-col p-4 space-y-4">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Home;
            return (
              <Link
                href={category.path}
                key={index}
                className="text-gray-400 hover:text-yellow-400 transition-colors flex items-center py-2 px-4 rounded-lg hover:bg-gray-800"
              >
                <IconComponent size={20} className="mr-3" />
                <span className="text-sm">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default SideNavBar;