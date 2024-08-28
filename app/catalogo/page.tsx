'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingSpinner from '@/components/LoadingSpinner';
import SideNavBar from '@/components/SideNavBar';
import { Menu } from 'lucide-react';

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
}

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
  path: string;
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Error al obtener productos');
        }
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      setCategories([
        { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰', path: '/ventas' },
        { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳', path: '/creditos' },
        { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚', path: '/catalogo' },
        { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️', path: '/administracion' },
        { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️', path: '/dashboard' },
      ]);
    };

    if (status === 'authenticated') {
      fetchProducts();
      fetchCategories();
    }
  }, [status]);

  useEffect(() => {
    const filtered = products.filter(product => 
      product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SideNavBar 
        categories={userCategories} 
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 text-white">
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-white">Catálogo</h1>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Catálogo de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="Buscar por código de caja, código de producto o nombre"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-4"
              />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product._id} className="flex flex-col">
                <CardContent className="flex-grow p-4">
                  {product.imageUrl && (
                    <div className="relative w-full h-48 mb-2">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded"
                      />
                    </div>
                  )}
                  <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold">Código de caja:</span> {product.boxCode}</p>
                    <p><span className="font-semibold">Código de producto:</span> {product.productCode}</p>
                    <p><span className="font-semibold">Piezas por caja:</span> {product.piecesPerBox}</p>
                    <p><span className="font-semibold">Costo:</span> ${product.cost.toFixed(2)}</p>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold">Precios:</p>
                    <p>Menudeo: ${product.price1.toFixed(2)} | A partir de: {product.price1MinQty}</p>
                    <p>Mayoreo: ${product.price2.toFixed(2)} | A partir de: {product.price2MinQty}</p>
                    <p>Caja: ${product.price3.toFixed(2)} | A partir de: {product.price3MinQty}</p>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold">Inventario:</p>
                    {product.stockLocations.map((location, index) => (
                      <p key={index}>{location.location}: {location.quantity}</p>
                    ))}
                  </div>
                </CardContent>
                <CardContent className="p-4 pt-0">
                  <Link href={`/bajo-construccion`} passHref>
                    <Button className="w-full">Ver detalles</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductCatalog;