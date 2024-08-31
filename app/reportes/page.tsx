"use client";

import React, { useState, useEffect } from 'react';
import pusher from '@/lib/pusher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationProfit {
  location: string;
  profit: number;
}

export default function RealTimeProfitPage() {
  const [totalProfit, setTotalProfit] = useState(0);
  const [locations, setLocations] = useState<LocationProfit[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/tickets?startDate=${today}&endDate=${today}`);
        const data = await response.json();
  
        if (data.totalProfit && data.locations) {
          setTotalProfit(data.totalProfit);
          setLocations(data.locations);
        }
      } catch (error) {
        console.error('Error fetching sales:', error);
      }
    };
  
    fetchSales();
  
    const channel = pusher.subscribe('sales-channel');
    channel.bind('new-sale', (data: { profit: number; timestamp: string }) => {
      setTotalProfit(prevTotal => prevTotal + data.profit);
    });
  
    return () => {
      pusher.unsubscribe('sales-channel');
    };
  }, []);
  

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">VENTAS EN TIEMPO REAL</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Utilidad Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${totalProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ubicaciones y Beneficio</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {locations.map((locationProfit) => (
                <li key={locationProfit.location} className="text-lg">
                  {locationProfit.location}: ${locationProfit.profit.toFixed(2)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
