// app/administracion/contenedores/precarga/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';

interface Product {
    name: string;
    code: string;
    expectedBoxes: number | null;
}

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const PrecargaContenedor = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [containerNumber, setContainerNumber] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Product>({ name: '', code: '', expectedBoxes: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const initialize = async () => {
      if (status === 'authenticated') {
        // Simulando una llamada a la API con setTimeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCategories([
          { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
          { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
          { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
          { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
          { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
        ]);
        setIsLoading(false);
      } else if (status === 'unauthenticated') {
        router.push('/login');
      }
    };

    initialize();
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  const handleContainerNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContainerNumber(e.target.value.toUpperCase());
  };

  const handleNewProductChange = (field: keyof Product, value: string | number | null) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: field === 'expectedBoxes' ? (value === '' ? null : Number(value)) : value?.toString().toUpperCase()
    }));
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.code && newProduct.expectedBoxes !== null) {
      setProducts([...products, newProduct]);
      setNewProduct({ name: '', code: '', expectedBoxes: null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (products.length === 0) {
      alert('Debe agregar al menos un producto antes de precargar el contenedor.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/containers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ containerNumber, products }),
      });

      if (response.ok) {
        setIsConfirmed(true);
        setTimeout(() => {
          setContainerNumber('');
          setProducts([]);
          setNewProduct({ name: '', code: '', expectedBoxes: null });
          setIsConfirmed(false);
          router.push('/administracion/contenedores');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al precargar el contenedor');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Ocurrió un error desconocido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const userRole = session.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between pb-20">
      <div className="p-4 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Precargar Contenedor</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-4 border border-yellow-400">
            <h2 className="text-xl font-semibold mb-4">Datos del Contenedor</h2>
            <input
              type="text"
              value={containerNumber}
              onChange={handleContainerNumberChange}
              placeholder="Número de Contenedor"
              className="w-full p-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50 uppercase-input"
            />
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-yellow-400">
            <h2 className="text-xl font-semibold mb-4">Productos</h2>
            {products.map((product, index) => (
              <div key={index} className="mb-4 p-4 border border-yellow-400 rounded bg-gray-800">
                <p>Nombre: {product.name}</p>
                <p>Código: {product.code}</p>
                <p>Cajas: {product.expectedBoxes}</p>
              </div>
            ))}
            <div className="mb-4 p-4 border border-yellow-400 rounded">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newProduct.name}
                onChange={(e) => handleNewProductChange('name', e.target.value)}
                className="w-full p-2 mb-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50 uppercase-input"
              />
              <input
                type="text"
                placeholder="Código del producto"
                value={newProduct.code}
                onChange={(e) => handleNewProductChange('code', e.target.value)}
                className="w-full p-2 mb-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50 uppercase-input"
              />
              <input
                type="number"
                placeholder="Cajas a recibir"
                value={newProduct.expectedBoxes === null ? '' : newProduct.expectedBoxes}
                onChange={(e) => handleNewProductChange('expectedBoxes', e.target.value)}
                className="w-full p-2 mb-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
              />
            </div>
            <button 
              type="button" 
              onClick={addProduct} 
              className="bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Agregar Producto
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
          >
            {isLoading ? 'Precargando...' : 'Precargar Contenedor'}
          </button>
        </form>

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        )}

        {isConfirmed && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <p className="text-green-500 text-xl font-bold">¡Contenedor precargado exitosamente!</p>
            </div>
          </div>
        )}
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

export default PrecargaContenedor;