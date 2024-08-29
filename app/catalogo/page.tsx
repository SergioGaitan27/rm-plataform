'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from '@/components/LoadingSpinner';
import SideNavBar from '@/components/SideNavBar';
import { Menu, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number;
  cost: number;
  price1: number;
  price1MinQty: number;
  price2: number;
  price2MinQty: number;
  price3: number;
  price3MinQty: number;
  price4?: number;
  price5?: number;
  stockLocations: {
    location: string;
    quantity: number;
  }[];
  imageUrl?: string;
  category: string;
  availability: boolean;
}

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
  path: string;
};

const getProductStatus = (product: Product, userLocation: string): 'inStock' | 'available' | 'unavailable' => {
  const totalStock = product.stockLocations.reduce((sum, location) => sum + location.quantity, 0);
  const stockInUserLocation = product.stockLocations.find(loc => loc.location === userLocation)?.quantity || 0;

  if (stockInUserLocation > 0) {
    return 'inStock';
  } else if (totalStock > 0) {
    return 'available';
  } else {
    return 'unavailable';
  }
};

const calculateInventory = (quantity: number, piecesPerBox: number) => {
  const boxes = Math.floor(quantity / piecesPerBox);
  const loosePieces = quantity % piecesPerBox;
  return { boxes, loosePieces };
};

const ProductCatalog: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [activeAvailability, setActiveAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [activeCategory, setActiveCategory] = useState<'inStock' | 'available' | 'unavailable' | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      toast.success('Productos actualizados correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar productos');
    } finally {
      setIsUpdating(false);
      setLoading(false); // Ensure loading is set to false after fetching products
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategories([
      { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰', path: '/ventas' },
      { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳', path: '/creditos' },
      { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚', path: '/catalogo' },
      { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️', path: '/administracion' },
      { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️', path: '/dashboard' },
    ]);
  }, []);

  const fetchUserLocation = useCallback(async () => {
    try {
      const response = await fetch('/api/user/location');
      if (!response.ok) {
        throw new Error('Error al obtener la ubicación del usuario');
      }
      const data = await response.json();
      setUserLocation(data.location);
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([fetchProducts(), fetchCategories(), fetchUserLocation()])
        .then(() => setLoading(false))
        .catch((error) => {
          console.error('Error loading data:', error);
          setLoading(false);
        });
    }
  }, [status, fetchProducts, fetchCategories, fetchUserLocation]);

  const filterProducts = useCallback(() => {
    const filtered = products.filter(product => {
      const status = getProductStatus(product, userLocation);
      const matchesSearch = 
        product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = activeCategory === '' || status === activeCategory;

      const matchesAvailability = 
        activeAvailability === 'all' || 
        (activeAvailability === 'available' && product.availability) ||
        (activeAvailability === 'unavailable' && !product.availability);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, products, activeCategory, activeAvailability, userLocation]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const userRole = session?.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getBorderColor = (product: Product): string => {
    const status = getProductStatus(product, userLocation);
    if (status === 'unavailable') {
      return 'border-black';
    }
    return product.availability ? 'border-green-500' : 'border-red-500';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toUpperCase());
  };

  const handleSearch = () => {
    if (searchTerm.trim().toUpperCase() === 'ACTUALIZAR') {
      fetchProducts();
      setSearchTerm('');
      return;
    }
    filterProducts();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderProductCard = (product: Product) => (
    <Card key={product._id} className={`flex flex-col border-2 ${getBorderColor(product)}`}>
      <CardContent className="flex-grow p-4">
        {product.imageUrl && (
          <div className="relative w-full h-32 sm:h-48 mb-2">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded"
            />
          </div>
        )}
        <h2 className="text-lg sm:text-xl font-bold mb-2">{product.name}</h2>
        <div className="space-y-1 text-xs sm:text-sm">
          <p><span className="font-semibold">Código de caja:</span> {product.boxCode}</p>
          <p><span className="font-semibold">Código de producto:</span> {product.productCode}</p>
          <p><span className="font-semibold">Piezas por caja:</span> {product.piecesPerBox}</p>
          <p><span className="font-semibold">Categoría:</span> {product.category}</p>
          <p><span className="font-semibold">Disponible:</span> {product.availability ? 'Sí' : 'No'}</p>
        </div>
        <div className="mt-2 text-xs sm:text-sm">
          <p className="font-semibold">Precios:</p>
          <p>Menudeo: ${product.price1.toFixed(2)} | Min: {product.price1MinQty}</p>
          <p>Mayoreo: ${product.price2.toFixed(2)} | Min: {product.price2MinQty}</p>
          <p>Caja: ${product.price3.toFixed(2)} | Min: {product.price3MinQty}</p>
        </div>
        <div className="mt-2 text-xs sm:text-sm">
          <p className="font-semibold">Inventario:</p>
          {product.stockLocations.map((location, index) => {
            const { boxes, loosePieces } = calculateInventory(location.quantity, product.piecesPerBox);
            return (
              <p key={index}>
                {location.location}: {boxes} {boxes === 1 ? 'caja' : 'cajas'}
                {loosePieces > 0 && ` y ${loosePieces} ${loosePieces === 1 ? 'pieza' : 'piezas'}`}
                {` (Total: ${location.quantity})`}
              </p>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-gray-900 p-4 flex justify-between items-center z-10">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 text-white">
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <h1 className="text-xl font-bold text-white">Catálogo</h1>
        </div>
      </header>
      <div className="flex flex-1 relative">
        <SideNavBar 
          categories={userCategories} 
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          className={`absolute top-0 left-0 h-full z-20 transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        />
        <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto">
          <Card className="mb-4 flex flex-col justify-center items-center p-4">
            <p className="text-lg sm:text-xl font-bold mt-2 mb-2">Filtrar productos</p>
            <div className="flex flex-wrap justify-center items-center gap-2 w-full py-2 mb-4">
              <Button
                onClick={() => {
                  setActiveCategory('');
                  setActiveAvailability('all');
                }}
                className={`text-xs sm:text-sm ${activeCategory === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                Todos
              </Button>
              <Button
                onClick={() => {
                  setActiveCategory('inStock');
                  setActiveAvailability('all');
                }}
                className={`text-xs sm:text-sm ${activeCategory === 'inStock' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                Con existencia y stock en tu ubicación
              </Button>
              <Button
                onClick={() => {
                  setActiveCategory('available');
                  setActiveAvailability('all');
                }}
                className={`text-xs sm:text-sm ${activeCategory === 'available' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                Con existencia y sin stock en tu ubicación
              </Button>
              <Button
                onClick={() => {
                  setActiveCategory('unavailable');
                  setActiveAvailability('all');
                }}
                className={`text-xs sm:text-sm ${activeCategory === 'unavailable' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                Sin existencia
              </Button>
            </div>
            {activeCategory !== '' && activeCategory !== 'unavailable' && (
              <Tabs 
                value={activeAvailability} 
                className="w-full" 
                onValueChange={(value) => setActiveAvailability(value as 'all' | 'available' | 'unavailable')}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="available">Disponibles</TabsTrigger>
                  <TabsTrigger value="unavailable">No Disponibles</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </Card>
          <Card className="mb-4 flex flex-col justify-center items-center p-4">
            <p className="text-lg sm:text-xl font-bold">Buscador de productos</p>
            <div className="flex w-full mt-4">
              <Input
                type="text"
                placeholder="Buscar por código o nombre"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                className="flex-grow"
              />
              <Button
                onClick={handleSearch}
                className="ml-2"
                disabled={isUpdating}
              >
                {isUpdating ? 'Actualizando...' : 'Buscar'}
              </Button>
            </div>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(renderProductCard)}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductCatalog;