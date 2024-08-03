// app/transferencias/historial/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';  // Cambiado de 'next/router' a 'next/navigation'
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

interface ITransfer {
  _id: string;
  transfers: Array<{
    productId: string;
    productName: string;
    productCode: string;
    boxCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
  }>;
  evidenceImageUrl: string;
  date: string;
}

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const HistorialTransferencias: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<ITransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (status === 'authenticated') {
        try {
          await Promise.all([fetchTransfers(), fetchCategories()]);
        } catch (error) {
          console.error('Error initializing data:', error);
          setError('Error al cargar los datos');
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    initialize();
  }, [status, router]);

  useEffect(() => {
    filterTransfers();
  }, [startDate, endDate, destinationFilter, transfers]);

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/transfers');
      if (!response.ok) throw new Error('Error al obtener las transferencias');
      const data = await response.json();
      setTransfers(data);
      setFilteredTransfers(data);
    } catch (error) {
      console.error('Error al cargar las transferencias:', error);
      throw new Error('Error al cargar el historial de transferencias');
    }
  };

  const fetchCategories = async () => {
    // Simulating API call with setTimeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCategories([
      { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
      { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
      { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
      { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
      { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
    ]);
  };

  const filterTransfers = () => {
    let filtered = transfers;

    if (startDate || endDate) {
      filtered = filtered.filter(transfer => {
        const transferDate = new Date(transfer.date);
        transferDate.setHours(0, 0, 0, 0);

        let isInRange = true;

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          isInRange = isInRange && transferDate >= start;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          isInRange = isInRange && transferDate <= end;
        }

        return isInRange;
      });
    }

    if (destinationFilter) {
      filtered = filtered.filter(transfer => 
        transfer.transfers.some(t => 
          t.toLocation.toLowerCase().includes(destinationFilter.toLowerCase()) ||
          t.fromLocation.toLowerCase().includes(destinationFilter.toLowerCase())
        )
      );
    }

    setFilteredTransfers(filtered);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (status === 'loading' || isLoading) return <LoadingSpinner />;
  if (!session) return null;

  const userRole = session.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4 pb-24">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center mb-4">Historial de Transferencias</h1>
        </div>

        <button
          onClick={toggleFilters}
          className="mb-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition-colors"
        >
          {showFilters ? 'Ocultar filtros' : 'Filtrar productos'}
        </button>

        {showFilters && (
          <div className="mb-4 flex flex-col sm:flex-row gap-4 bg-gray-800 p-4 rounded-lg">
            <div className="flex flex-col">
              <label htmlFor="startDate" className="text-sm mb-1">Fecha inicial:</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-700 text-yellow-400 rounded px-3 py-2 w-full sm:w-auto"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endDate" className="text-sm mb-1">Fecha final:</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-700 text-yellow-400 rounded px-3 py-2 w-full sm:w-auto"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="destinationFilter" className="text-sm mb-1">Origen o destino:</label>
              <input
                id="destinationFilter"
                type="text"
                placeholder="Filtrar por origen o destino"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="bg-gray-700 text-yellow-400 rounded px-3 py-2 w-full sm:w-auto"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {filteredTransfers.length === 0 ? (
          <p>No hay transferencias en el historial que coincidan con los filtros.</p>
        ) : (
          <ul className="space-y-4 text-lg">
            {filteredTransfers.map((transfer) => {
              const transferDate = new Date(transfer.date);
              const origenDestino = transfer.transfers.map(t => `${t.fromLocation} → ${t.toLocation}`);
              const uniqueOrigenDestino = Array.from(new Set(origenDestino));
              return (
                <li key={transfer._id} className="bg-gray-800 rounded-lg p-4 shadow-lg">
                  <div className="grid grid-cols-2 text-lg mb-4">
                    <InfoItem label="Fecha:" value={transferDate.toLocaleDateString()} />
                    <InfoItem label="Hora:" value={transferDate.toLocaleTimeString()} />
                    <InfoItem label="Total de productos:" value={transfer.transfers.length.toString()} />
                    <InfoItem label="Total de unidades:" value={transfer.transfers.reduce((acc, t) => acc + t.quantity, 0).toString()} />
                    <InfoItem label="Origen → Destino:" value={uniqueOrigenDestino.join(', ')} />
                  </div>
                  <Link 
                    href={`/transferencias/historial/${transfer._id}`}
                    className="mt-2 inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition-colors"
                  >
                    Ver detalles
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-gray-400 text-base">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default HistorialTransferencias;