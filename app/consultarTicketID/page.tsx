"use client"

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface TicketItem {
  productName: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  pricePerUnit: number;
  total: number;
}

interface Ticket {
  ticketId: string;
  location: string;
  items: TicketItem[];
  totalAmount: number;
  paymentType: 'cash' | 'card';
  amountPaid: number;
  change: number;
  date: string;
}

interface IBusinessInfo {
  businessName: string;
  address: string;
  phone: string;
  taxId: string;
}

const TicketQueryPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Consulta de Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando...</div>}>
            <TicketQueryContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

const TicketQueryContent: React.FC = () => {
  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [businessInfo, setBusinessInfo] = useState<IBusinessInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const fetchTicket = useCallback(async (id: string) => {
    if (!id) {
      toast.error('Por favor, ingrese un ID de ticket');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/${id}`);
      if (!response.ok) {
        throw new Error('Ticket no encontrado');
      }
      const data = await response.json();
      setTicket(data);

      // Ahora obtener la información del negocio con la ubicación del ticket
      const businessResponse = await fetch(`/api/business?location=${encodeURIComponent(data.location)}`);
      if (!businessResponse.ok) {
        throw new Error('Información de negocio no encontrada');
      }
      const businessData = await businessResponse.json();
      setBusinessInfo(businessData);
    } catch (error) {
      console.error('Error al obtener el ticket o la información del negocio:', error);
      toast.error('Error al obtener la información. Por favor, intente de nuevo.');
      setTicket(null);
      setBusinessInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setTicketId(id);
      fetchTicket(id);
    }
  }, [searchParams, fetchTicket]);

  const handleSearch = () => {
    fetchTicket(ticketId);
  };

  return (
    <>
      <div className="flex space-x-2 mb-4">
        <Input
          type="text"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Ingrese el ID del ticket"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {ticket && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Detalles del Ticket</h2>
          <p><strong>ID del Ticket:</strong> {ticket.ticketId}</p>
          <p><strong>Ubicación:</strong> {ticket.location}</p>
          <p><strong>Fecha:</strong> {new Date(ticket.date).toLocaleString()}</p>
          <p><strong>Tipo de Pago:</strong> {ticket.paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}</p>
          <p><strong>Total:</strong> ${ticket.totalAmount.toFixed(2)}</p>
          <p><strong>Monto Pagado:</strong> ${ticket.amountPaid.toFixed(2)}</p>
          <p><strong>Cambio:</strong> ${ticket.change.toFixed(2)}</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">Artículos</h3>
          <ul>
            {ticket.items.map((item, index) => (
              <li key={index} className="mb-2">
                <p><strong>{item.productName}</strong></p>
                <p>Cantidad: {item.quantity} {item.unitType}</p>
                <p>Precio por unidad: ${item.pricePerUnit.toFixed(2)}</p>
                <p>Total: ${item.total.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Información del negocio relacionada */}
      {businessInfo && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-lg font-bold mb-2">Información del Negocio</h2>
          <p><strong>Nombre:</strong> {businessInfo.businessName}</p>
          <p><strong>Dirección:</strong> {businessInfo.address}</p>
          <p><strong>Teléfono:</strong> {businessInfo.phone}</p>
          <p><strong>RFC:</strong> {businessInfo.taxId}</p>
        </div>
      )}
    </>
  );
};

export default TicketQueryPage;
