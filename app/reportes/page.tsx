'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Corte {
  _id: string;
  location: string;
  date: string;
  totalCash: number;
  totalCard: number;
  totalTickets: number;
}

const ReportesPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchCortes();
      fetchLocations();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, session]);

  const fetchCortes = async () => {
    try {
      const response = await fetch('/api/reportes');
      if (!response.ok) {
        throw new Error('Error al obtener los cortes');
      }
      const data = await response.json();
      setCortes(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (!response.ok) {
        throw new Error('Error al obtener las ubicaciones');
      }
      const data = await response.json();
      setLocations(['all', ...data]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatData = (cortes: Corte[]) => {
    return cortes
      .filter(corte => 
        (selectedLocation === 'all' || corte.location === selectedLocation) &&
        (!dateRange?.from || new Date(corte.date) >= dateRange.from) &&
        (!dateRange?.to || new Date(corte.date) <= dateRange.to)
      )
      .map(corte => ({
        date: new Date(corte.date).toLocaleDateString(),
        totalCash: corte.totalCash,
        totalCard: corte.totalCard,
        total: corte.totalCash + corte.totalCard
      }));
  };

  const handleGenerateReport = () => {
    // Aquí puedes implementar la lógica para generar un reporte más detallado
    console.log("Generando reporte...");
  };

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reportes de Ventas</h1>
      <div className="mb-4 flex space-x-4">
        <DateRangePicker
          value={dateRange}
          onValueChange={(range) => setDateRange(range)}
        />
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar ubicación" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(location => (
              <SelectItem key={location} value={location}>
                {location === 'all' ? 'Todas las ubicaciones' : location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerateReport}>Generar Reporte</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas Diarias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={formatData(cortes)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalCash" stroke="#8884d8" name="Efectivo" />
              <Line type="monotone" dataKey="totalCard" stroke="#82ca9d" name="Tarjeta" />
              <Line type="monotone" dataKey="total" stroke="#ffc658" name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportesPage;