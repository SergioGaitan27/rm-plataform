import React, { useState, useEffect } from 'react';
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
}

const ProfitDashboard: React.FC = () => {
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [timeframe, setTimeframe] = useState<string>('day');
  const [location, setLocation] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket: Socket = io();
    setSocket(newSocket);

    newSocket.on('initialData', (data: ProfitData[]) => {
      setProfitData(data);
    });

    newSocket.on('ticketUpdate', (newData: TicketUpdate) => {
      setProfitData((prevData) => {
        const lastEntry = prevData[prevData.length - 1];
        if (lastEntry && lastEntry._id === newData.date.split('T')[0]) {
          // Update the last day if it already exists
          const updatedLastEntry: ProfitData = {
            ...lastEntry,
            totalProfit: lastEntry.totalProfit + newData.profit,
            totalSales: lastEntry.totalSales + newData.sales
          };
          return [...prevData.slice(0, -1), updatedLastEntry];
        } else {
          // Add a new day if it doesn't exist
          return [...prevData, {
            _id: newData.date.split('T')[0],
            totalProfit: newData.profit,
            totalSales: newData.sales
          }];
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit('requestInitialData', { timeframe, location });
    }
  }, [timeframe, location, socket]);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Profit en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select onValueChange={setTimeframe} defaultValue={timeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
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