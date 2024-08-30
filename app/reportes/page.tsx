'use client'

import React, { useState, useEffect } from 'react';
import pusher from '@/lib/pusher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Asumimos que esta función existe y realiza la llamada a la API
import { fetchInitialData } from '@/lib/api';

export default function RealTimeProfitPage() {
  const [lastSale, setLastSale] = useState<{ profit: number; timestamp: string } | null>(null);
  const [totalProfit, setTotalProfit] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchInitialData();
        setTotalProfit(data.totalProfit);
        setSaleCount(data.saleCount);
        setLastSale(data.lastSale);
      } catch (error) {
        console.error('Error al cargar los datos iniciales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    const channel = pusher.subscribe('sales-channel');
    channel.bind('new-sale', (data: { profit: number; timestamp: string }) => {
      setLastSale(data);
      setTotalProfit(prevTotal => prevTotal + data.profit);
      setSaleCount(prevCount => prevCount + 1);
    });

    return () => {
      pusher.unsubscribe('sales-channel');
    };
  }, []);

  if (isLoading) {
    return <div>Cargando datos...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Beneficio en Tiempo Real</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Beneficio Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${totalProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Última Venta</CardTitle>
          </CardHeader>
          <CardContent>
            {lastSale ? (
              <>
                <p className="text-2xl font-bold">${lastSale.profit.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{new Date(lastSale.timestamp).toLocaleString()}</p>
              </>
            ) : (
              <p>Sin ventas registradas</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{saleCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}