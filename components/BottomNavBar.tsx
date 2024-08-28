'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';
import { Home, ShoppingCart, CreditCard, Book, Settings, BarChart2 } from 'lucide-react';

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
  path: string;
};

type BottomNavBarProps = {
  categories: Category[];
};

const iconMap = {
  '💰': ShoppingCart,
  '💳': CreditCard,
  '📚': Book,
  '⚙️': Settings,
  '🗂️': BarChart2,
};

const BottomNavBar = ({ categories }: BottomNavBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <nav className="bg-gray-900 fixed bottom-0 left-0 right-0 shadow-lg">
      <div 
        ref={scrollRef}
        className="overflow-x-auto flex items-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex p-2 space-x-4">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Home;
            return (
              <Link
                href={category.path}
                key={index}
                className="text-center text-gray-400 hover:text-yellow-400 transition-colors flex flex-col items-center flex-shrink-0 min-w-[64px] py-2"
              >
                <IconComponent size={24} className="mb-1" />
                <span className="text-xs whitespace-nowrap">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBar;