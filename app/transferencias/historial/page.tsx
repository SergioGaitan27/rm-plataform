'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';

// Interfaz para la estructura de una transferencia
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

const HistorialTransferencias = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<ITransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransfers();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    filterTransfers();
  }, [transfers, dateFilter, destinationFilter]);

  // Función para obtener las transferencias del servidor
  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/transfers');
      if (!response.ok) throw new Error('Error al obtener las transferencias');
      const data = await response.json();
      setTransfers(data);
    } catch (error) {
      console.error('Error al cargar las transferencias:', error);
      setError('Error al cargar el historial de transferencias');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para filtrar las transferencias
  const filterTransfers = () => {
    let filtered = transfers;

    if (dateFilter) {
      filtered = filtered.filter(transfer => 
        transfer.date.includes(dateFilter)
      );
    }

    if (destinationFilter) {
      filtered = filtered.filter(transfer => 
        transfer.transfers.some(t => t.toLocation.toLowerCase().includes(destinationFilter.toLowerCase()))
      );
    }

    setFilteredTransfers(filtered);
  };

  if (status === 'loading' || isLoading) return <LoadingSpinner />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4 pb-24">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center mb-4">Historial de Transferencias</h1>
        </div>

        {/* Controles de filtro */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-800 text-yellow-400 rounded px-3 py-2 w-full sm:w-auto"
          />
          <input
            type="text"
            placeholder="Filtrar por destino"
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value)}
            className="bg-gray-800 text-yellow-400 rounded px-3 py-2 w-full sm:w-auto"
          />
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {filteredTransfers.length === 0 ? (
          <p>No hay transferencias en el historial que coincidan con los filtros.</p>
        ) : (
          <ul className="space-y-4">
            {filteredTransfers.map((transfer) => (
              <li key={transfer._id} className="bg-gray-800 rounded-lg p-4 shadow-lg">
                <h3 className="text-xl font-semibold mb-2 text-yellow-400">Fecha: {new Date(transfer.date).toLocaleString()}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <InfoItem label="Total de productos:" value={transfer.transfers.length.toString()} />
                  <InfoItem label="Total de unidades:" value={transfer.transfers.reduce((acc, t) => acc + t.quantity, 0).toString()} />
                </div>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Productos transferidos:</h4>
                  <ul className="list-disc list-inside">
                    {transfer.transfers.map((t, index) => (
                      <li key={index}>
                        {t.productName} - De {t.fromLocation} a {t.toLocation} ({t.quantity} unidades)
                      </li>
                    ))}
                  </ul>
                </div>
                {transfer.evidenceImageUrl && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Evidencia:</h4>
                    <div className="relative w-full h-40">
                      <Image
                        src={transfer.evidenceImageUrl}
                        alt="Evidencia de transferencia"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded"
                      />
                    </div>
                  </div>
                )}
                <Link 
                  href={`/transferencias/historial/${transfer._id}`}
                  className="mt-4 inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded hover:bg-yellow-300 transition-colors"
                >
                  Ver detalles
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNavBar categories={[]} />
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-gray-400 text-xs">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default HistorialTransferencias;