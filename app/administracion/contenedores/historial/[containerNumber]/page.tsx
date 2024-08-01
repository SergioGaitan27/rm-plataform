'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Product {
  name: string;
  code: string;
  expectedBoxes: number;
  receivedBoxes: number;
}

interface ContainerDetails {
  containerNumber: string;
  products: Product[];
  status: string;
  totalExpectedBoxes: number;
  totalReceivedBoxes: number;
  updatedAt: string;
}

const ContainerDetails = () => {
  const params = useParams();
  const containerNumber = params.containerNumber as string;
  const [containerDetails, setContainerDetails] = useState<ContainerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContainerDetails = async () => {
      if (!containerNumber) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/containers/${containerNumber}`);
        if (!response.ok) throw new Error('Failed to fetch container details');
        const data = await response.json();
        setContainerDetails(data.data);
      } catch (error) {
        console.error('Error fetching container details:', error);
        setError('Error al cargar los detalles del contenedor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContainerDetails();
  }, [containerNumber]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!containerDetails) return <p>No se encontraron detalles del contenedor</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-yellow-400 text-gray-900 p-6">
          <h1 className="text-3xl font-bold">Detalles del Contenedor: {containerDetails.containerNumber}</h1>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-lg">
            <InfoItem label="Estado:" value={containerDetails.status === 'received' ? 'Recibido' : containerDetails.status} />
            <InfoItem label="Fecha de recepción:" value={new Date(containerDetails.updatedAt).toLocaleString()} />
            <InfoItem label="Total de cajas esperadas:" value={containerDetails.totalExpectedBoxes.toString()} />
            <InfoItem label="Total de cajas recibidas:" value={containerDetails.totalReceivedBoxes.toString()} />
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-yellow-400">Productos:</h2>
          <div className="space-y-4">
            {containerDetails.products.map((product, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2 text-yellow-400">{product.name}</h3>
                <div className="mb-2">
                  <InfoItem label="Código:" value={product.code} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xl">
                  <InfoItem label="Cajas esperadas:" value={product.expectedBoxes.toString()} />
                  <InfoItem label="Cajas recibidas:" value={product.receivedBoxes.toString()} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-gray-400 text-base">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default ContainerDetails;