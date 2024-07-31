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

const BottomNavBarDashboard = ({ categories }: BottomNavBarProps) => {
  return (
    <nav className="bg-gray-900 fixed bottom-0 left-0 right-0 shadow-md">
      <div >
        <div className="flex p-10 space-x-4">
          <p></p>
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBarDashboard;