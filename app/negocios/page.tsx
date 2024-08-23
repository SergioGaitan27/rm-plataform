"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'react-hot-toast';

interface BusinessInfo {
  location: string;
  businessName: string;
  address: string;
  phone: string;
  taxId: string;
}

const BusinessInfoPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/business-info');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data);
      } else {
        toast.error('Error al obtener la información de los negocios');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al conectar con el servidor');
    }
  };

  const handleSelectBusiness = (location: string) => {
    const business = businesses.find(b => b.location === location);
    setSelectedBusiness(business || null);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedBusiness) {
      setSelectedBusiness({
        ...selectedBusiness,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSave = async () => {
    if (!selectedBusiness) return;

    try {
      const response = await fetch('/api/business-info', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedBusiness),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Negocio actualizado' : 'Nuevo negocio añadido');
        fetchBusinesses();
        setIsEditing(false);
      } else {
        toast.error('Error al guardar la información del negocio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al conectar con el servidor');
    }
  };

  const handleDelete = async () => {
    if (!selectedBusiness) return;

    if (window.confirm('¿Está seguro de que desea eliminar este negocio?')) {
      try {
        const response = await fetch(`/api/business-info?location=${encodeURIComponent(selectedBusiness.location)}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Negocio eliminado');
          fetchBusinesses();
          setSelectedBusiness(null);
        } else {
          toast.error('Error al eliminar el negocio');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al conectar con el servidor');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Administración de Información de Negocios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Seleccionar Negocio</label>
              <Select 
                value={selectedBusiness?.location || ''} 
                onValueChange={handleSelectBusiness}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.location} value={business.location}>
                      {business.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBusiness && (
              <>
                <Input
                  name="businessName"
                  value={selectedBusiness.businessName}
                  onChange={handleInputChange}
                  placeholder="Nombre del Negocio"
                  disabled={!isEditing}
                />
                <Input
                  name="location"
                  value={selectedBusiness.location}
                  onChange={handleInputChange}
                  placeholder="Ubicación"
                  disabled={!isEditing}
                />
                <Input
                  name="address"
                  value={selectedBusiness.address}
                  onChange={handleInputChange}
                  placeholder="Dirección"
                  disabled={!isEditing}
                />
                <Input
                  name="phone"
                  value={selectedBusiness.phone}
                  onChange={handleInputChange}
                  placeholder="Teléfono"
                  disabled={!isEditing}
                />
                <Input
                  name="taxId"
                  value={selectedBusiness.taxId}
                  onChange={handleInputChange}
                  placeholder="RFC"
                  disabled={!isEditing}
                />
                <div className="flex space-x-2">
                  {isEditing ? (
                    <Button onClick={handleSave} className="flex-1">Guardar</Button>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} className="flex-1">Editar</Button>
                  )}
                  <Button onClick={handleDelete} variant="destructive" className="flex-1">Eliminar</Button>
                </div>
              </>
            )}
            <Button onClick={() => {
              setSelectedBusiness({
                location: '',
                businessName: '',
                address: '',
                phone: '',
                taxId: ''
              });
              setIsEditing(true);
            }} className="w-full">
              Añadir Nuevo Negocio
            </Button>
            <Button onClick={() => router.push('/ventas')} variant="outline" className="w-full">
              Volver a Ventas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessInfoPage;