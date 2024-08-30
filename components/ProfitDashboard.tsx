// components/ProfitDashboard.tsx

"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Socket, io } from 'socket.io-client';

// Define interfaces for your data structures
interface ProfitData {
  _id: string;
  totalProfit: number;
  totalSales: number;
}

interface TicketUpdate {
  date: string;
  profit: number;
  sales: number;
  location: string;
}

const ProfitDashboard: React.FC = () => {
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [timeframe, setTimeframe] = useState<string>('day');
  const [location, setLocation] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Function to get the start date based on the selected timeframe
  const getStartDate = (selectedTimeframe: string): string => {
    const now = new Date();
    switch (selectedTimeframe) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      default: // 'day'
        now.setHours(0, 0, 0, 0);
    }
    return now.toISOString();
  };

  // Function to fetch initial data
  const fetchInitialData = useCallback(async () => {
    const startDate = getStartDate(timeframe);
    const endDate = new Date().toISOString();
    const response = await fetch(`/api/tickets?startDate=${startDate}&endDate=${endDate}&location=${location}&limit=1000`);
    const data = await response.json();
    setProfitData(data.tickets.map((ticket: any) => ({
      _id: new Date(ticket.date).toISOString().split('T')[0],
      totalProfit: ticket.totalProfit,
      totalSales: ticket.totalAmount
    })));
  }, [timeframe, location]);

  // Effect to initialize Socket.IO connection
  useEffect(() => {
    const newSocket: Socket = io();
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Effect to handle Socket.IO events and fetch initial data
  useEffect(() => {
    if (!socket) return;

    fetchInitialData();

    socket.on('newTicket', (newData: TicketUpdate) => {
      setProfitData((prevData) => {
        const date = new Date(newData.date).toISOString().split('T')[0];
        const existingIndex = prevData.findIndex(item => item._id === date);
        if (existingIndex !== -1) {
          const updatedData = [...prevData];
          updatedData[existingIndex] = {
            ...updatedData[existingIndex],
            totalProfit: updatedData[existingIndex].totalProfit + newData.profit,
            totalSales: updatedData[existingIndex].totalSales + newData.sales
          };
          return updatedData;
        } else {
          return [...prevData, {
            _id: date,
            totalProfit: newData.profit,
            totalSales: newData.sales
          }];
        }
      });
    });

    return () => {
      socket.off('newTicket');
    };
  }, [socket, fetchInitialData]);

  // Effect to refetch data when timeframe or location changes
  useEffect(() => {
    fetchInitialData();
  }, [timeframe, location, fetchInitialData]);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Profit en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex space-x-4">
            <Select onValueChange={setTimeframe} value={timeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setLocation} value={location}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="TECOM">TECOM</SelectItem>
                <SelectItem value="TLAJOMULCO">TLAJOMULCO</SelectItem>
                {/* Añade más ubicaciones según sea necesario */}
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="totalProfit" stroke="#8884d8" name="Profit" />
              <Line yAxisId="right" type="monotone" dataKey="totalSales" stroke="#82ca9d" name="Ventas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitDashboard;