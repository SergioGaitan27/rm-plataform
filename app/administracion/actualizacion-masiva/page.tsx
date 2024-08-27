'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomNavBar from '@/components/BottomNavBar';
import { cn } from '@/lib/utils';

async function updateAllProducts() {
  try {
    const response = await fetch('/api/products/updateAll', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Respuesta del servidor:', data);
      throw new Error(data.error || `Error del servidor: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Error al actualizar las ubicaciones de los productos:', error);
    throw error;
  }
}

const MassUpdatePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateAllProducts();
      setUpdateResult({ success: true, message: result.message });
    } catch (error) {
      setUpdateResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Error desconocido al actualizar las ubicaciones de los productos.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const userCategories = [
    { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
    { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
    { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
    { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
    { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
  ].filter(category => category.allowedRoles.includes(session.user?.role as string));

  return (
    <div className="min-h-screen bg-secondary text-primary flex flex-col justify-between">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Actualización Masiva de Ubicaciones de Productos</h1>
        <div className="bg-gray-900 rounded-lg p-6 mb-6 shadow-md">
          <p className="mb-4">Esta acción actualizará todos los productos con las siguientes ubicaciones:</p>
          <ul className="list-disc list-inside mb-4">
            <li>L120: 100,000 unidades</li>
            <li>L123: 100,000 unidades</li>
            <li>L144: 100,000 unidades</li>
            <li>L152: 100,000 unidades</li>
          </ul>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Advertencia</p>
            <p>Esta acción agregará las nuevas ubicaciones a todos los productos. Si un producto ya tiene alguna de estas ubicaciones, su cantidad será actualizada a 100,000 unidades.</p>
          </div>
          <button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className={cn(
              "w-full p-2 rounded",
              "bg-primary text-secondary",
              "hover:bg-yellow-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isUpdating ? 'Actualizando...' : 'Actualizar Ubicaciones de Productos'}
          </button>
        </div>
        
        {updateResult && (
          <div className={cn(
            "mt-4 p-4 rounded-lg",
            updateResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          )}>
            <h5 className="font-bold">{updateResult.success ? 'Éxito' : 'Error'}</h5>
            <p>{updateResult.message}</p>
          </div>
        )}
      </div>
      <BottomNavBar categories={userCategories} />
    </div>
  );
};

export default MassUpdatePage;