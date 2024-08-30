"use client"

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfitData {
  _id: string;
  totalProfit: number;
  totalSales: number;
}

const ProfitDashboard: React.FC = () => {
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('https://www.rmazh.com.mx', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('initialData', (data: ProfitData[]) => {
        console.log('Received initial data:', data);
        setProfitData(data);
      });

      socket.on('ticketUpdate', (update: { date: string; profit: number; sales: number }) => {
        console.log('Received ticket update:', update);
        setProfitData(prevData => {
          const updatedData = [...prevData];
          const existingDataIndex = updatedData.findIndex(item => item._id === update.date.split('T')[0]);
          if (existingDataIndex !== -1) {
            updatedData[existingDataIndex] = {
              ...updatedData[existingDataIndex],
              totalProfit: updatedData[existingDataIndex].totalProfit + update.profit,
              totalSales: updatedData[existingDataIndex].totalSales + update.sales
            };
          } else {
            updatedData.push({
              _id: update.date.split('T')[0],
              totalProfit: update.profit,
              totalSales: update.sales
            });
          }
          return updatedData.sort((a, b) => new Date(b._id).getTime() - new Date(a._id).getTime());
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('initialData');
        socket.off('ticketUpdate');
      }
    };
  }, [socket]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {profitData.map((data) => (
        <Card key={data._id} className="overflow-hidden">
          <CardHeader>
            <CardTitle>{new Date(data._id).toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">Profit: ${data.totalProfit.toFixed(2)}</p>
            <p className="text-xl text-green-600">Ventas: ${data.totalSales.toFixed(2)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfitDashboard;