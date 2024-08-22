'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

interface ITransferItem {
  productId: string;
  productName: string;
  productCode: string;
  boxCode: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
}

interface ITransfer {
  _id: string;
  transfers: ITransferItem[];
  evidenceImageUrl: string;
  date: string;
}

const TransferenciaDetalle = ({ params }: { params: { transferNumber: string } }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transfer, setTransfer] = useState<ITransfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransferDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/transfers/${params.transferNumber}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch transfer details');
      }
      const data = await response.json();
      setTransfer(data);
    } catch (error) {
      console.error('Error fetching transfer details:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los detalles de la transferencia');
    } finally {
      setIsLoading(false);
    }
  }, [params.transferNumber]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransferDetails();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, fetchTransferDetails]);

  if (status === 'loading' || isLoading) return <LoadingSpinner />;
  if (!session) return null;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!transfer) return <div>No se encontró la transferencia</div>;

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
      <div className="p-4 pb-24">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center mb-4">Detalles de Transferencia</h1>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Información General</h2>
          <p className="mb-2"><span className="font-semibold">ID de Transferencia:</span> {transfer._id}</p>
          <p className="mb-2"><span className="font-semibold">Fecha:</span> {new Date(transfer.date).toLocaleString()}</p>
          <p className="mb-2"><span className="font-semibold">Total de Productos:</span> {transfer.transfers.length}</p>
          <p className="mb-2"><span className="font-semibold">Total de Unidades:</span> {transfer.transfers.reduce((acc, t) => acc + t.quantity, 0)}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Productos Transferidos</h2>
          <ul className="space-y-4">
            {transfer.transfers.map((item, index) => (
              <li key={index} className="border-b border-gray-700 pb-4 last:border-b-0">
                <h3 className="text-xl font-semibold mb-2">{item.productName}</h3>
                <p className="mb-1"><span className="font-semibold">Código de Producto:</span> {item.productCode}</p>
                <p className="mb-1"><span className="font-semibold">Código de Caja:</span> {item.boxCode}</p>
                <p className="mb-1"><span className="font-semibold">Desde:</span> {item.fromLocation}</p>
                <p className="mb-1"><span className="font-semibold">Hacia:</span> {item.toLocation}</p>
                <p className="mb-1"><span className="font-semibold">Cantidad:</span> {item.quantity}</p>
              </li>
            ))}
          </ul>
        </div>

        {transfer.evidenceImageUrl && (
          <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-6">
            <h2 className="text-2xl font-semibold mb-4">Evidencia</h2>
            <div className="relative w-full h-64">
              <Image
                src={transfer.evidenceImageUrl}
                alt="Evidencia de transferencia"
                fill
                style={{ objectFit: 'contain' }}
                className="rounded"
              />
            </div>
          </div>
        )}

        <button 
          onClick={() => router.back()} 
          className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
        >
          Volver al Historial
        </button>
      </div>
      <BottomNavBar categories={[]} />
    </div>
  );
};

export default TransferenciaDetalle;