import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { io, Socket } from 'socket.io-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfitData {
  _id: string;
  totalProfit: number;
  totalSales: number;
}

const ProfitDashboard: React.FC = () => {
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date()
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [timeframe, setTimeframe] = useState<string>('week');
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    const newSocket = io('https://www.rmazh.com.mx');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchInitialData = useCallback(() => {
    if (socket) {
      socket.emit('requestInitialData', { timeframe, location });
    }
  }, [socket, timeframe, location]);

  useEffect(() => {
    if (socket) {
      fetchInitialData();

      socket.on('initialData', (data: ProfitData[]) => {
        setProfitData(data);
      });

      socket.on('ticketUpdate', (update: { date: string; profit: number; sales: number }) => {
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
          return updatedData.sort((a, b) => new Date(a._id).getTime() - new Date(b._id).getTime());
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('initialData');
        socket.off('ticketUpdate');
      }
    };
  }, [socket, fetchInitialData]);

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
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="totalProfit" fill="#8884d8" name="Profit" />
              <Bar yAxisId="right" dataKey="totalSales" fill="#82ca9d" name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitDashboard;