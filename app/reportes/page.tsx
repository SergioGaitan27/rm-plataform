'use client'

import React, { useState, useEffect } from 'react';
import pusher from '@/lib/pusher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RealTimeProfitPage() {
  const [profitData, setProfitData] = useState<{ timestamp: string; profit: number }[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    const channel = pusher.subscribe('sales-channel');
    channel.bind('new-sale', (data: { profit: number; timestamp: string }) => {
      setProfitData(prevData => {
        const newData = [...prevData, data].slice(-20); // Keep only last 20 data points
        return newData;
      });
      setTotalProfit(prevTotal => prevTotal + data.profit);
    });

    return () => {
      pusher.unsubscribe('sales-channel');
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Beneficio en Tiempo Real</h1>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Beneficio Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">${totalProfit.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Beneficios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}