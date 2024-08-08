'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StockLocation {
  location: string;
  quantity: number | null;
}

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
    stockLocations: StockLocation[];
    imageUrl?: string;
  }

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

type PriceKey = `price${1 | 2 | 3 | 4 | 5}`;
type PriceMinQtyKey = `price${1 | 2 | 3}MinQty`;

const EditProductPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Error fetching products');
        }
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      setCategories([
        { name: 'Punto de venta', allowedRoles: ['vendedor'], icon: '💰' },
        { name: 'Créditos', allowedRoles: ['super_administrador', 'administrador'], icon: '💳' },
        { name: 'Catálogo', allowedRoles: ['super_administrador', 'administrador'], icon: '📚' },
        { name: 'Administración', allowedRoles: ['super_administrador', 'administrador'], icon: '⚙️' },
        { name: 'Dashboard', allowedRoles: ['super_administrador', 'administrador'], icon: '🗂️' },
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

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct({ ...product });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedProduct) return;

    const { name, value } = e.target;
    setEditedProduct(prev => ({
        ...prev!,
        [name]: name.includes('price') || name === 'cost' || name.includes('MinQty') || name === 'piecesPerBox'
            ? value === '' ? 0 : Number(value) // Evitar null, usar 0 como fallback
            : value.toUpperCase(), // Convertir a mayúsculas para los campos de texto
    }));
  };

  const handleStockLocationChange = (index: number, field: 'location' | 'quantity', value: string) => {
    if (!editedProduct) return;

    const updatedLocations = [...editedProduct.stockLocations];

    if (field === 'location') {
        updatedLocations[index].location = value.toUpperCase(); // Convertir a mayúsculas
    } else if (field === 'quantity') {
        updatedLocations[index].quantity = value === '' ? null : Number(value); // Permitir null
    }

    setEditedProduct({
        ...editedProduct,
        stockLocations: updatedLocations
    });
  };

  const addStockLocation = () => {
    if (!editedProduct) return;

    setEditedProduct({
      ...editedProduct,
      stockLocations: [...editedProduct.stockLocations, { location: '', quantity: 0 }]
    });
  };

  const removeStockLocation = (index: number) => {
    if (!editedProduct) return;

    const updatedLocations = editedProduct.stockLocations.filter((_, i) => i !== index);
    setEditedProduct({
      ...editedProduct,
      stockLocations: updatedLocations
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedProduct) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${editedProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProduct),
      });

      if (!response.ok) {
        throw new Error('Error updating product');
      }

      const updatedProduct = await response.json();
      setProducts(prevProducts => 
        prevProducts.map(p => p._id === updatedProduct.data._id ? updatedProduct.data : p)
      );
      setSelectedProduct(null);
      setEditedProduct(null);
      setIsConfirmed(true);

      // Limpiar el término de búsqueda
      setSearchTerm('');

      // Esperar 2 segundos, mostrar el mensaje y luego redirigir
      setTimeout(() => {
        setIsConfirmed(false);
        router.push('/administracion/productos/modificar');  // Redirigir a la misma página actual
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };



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

  return (
    <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between pb-10">  {/* pb-32 agregado */}
      <div className="p-4 mb-20">
        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-center">Editar Productos</h1>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-6 shadow-md">     
            {!selectedProduct && (
            <input
                type="text"
                placeholder="Buscar por código de caja, código de producto o nombre"
                className="w-full p-2 mb-4 bg-gray-800 text-yellow-400 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} // Convertir a mayúsculas
            />
            )}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {!selectedProduct ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="bg-gray-800 p-4 rounded-lg shadow cursor-pointer" onClick={() => handleProductSelect(product)}>
                  <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                  <p><span className="font-semibold">Código de caja:</span> {product.boxCode}</p>
                  <p><span className="font-semibold">Código de producto:</span> {product.productCode}</p>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Nombre del producto</label>
                <input
                  type="text"
                  name="name"
                  value={editedProduct?.name || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Código de caja</label>
                <input
                  type="text"
                  name="boxCode"
                  value={editedProduct?.boxCode || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Código de producto</label>
                <input
                  type="text"
                  name="productCode"
                  value={editedProduct?.productCode || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Piezas por caja</label>
                <input
                  type="number"
                  name="piecesPerBox"
                  value={editedProduct?.piecesPerBox || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Costo</label>
                <input
                  type="number"
                  name="cost"
                  value={editedProduct?.cost || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded"
                  step="0.01"
                  required
                />
              </div>
              {[1, 2, 3].map((num) => (
                <div key={num}>
                    <label className="block mb-1">Precio {num}</label>
                    <input
                    type="number"
                    name={`price${num}`}
                    value={editedProduct?.[`price${num}` as PriceKey]?.toString() ?? ''}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 rounded"
                    step="0.01"
                    required
                    />
                    <label className="block mb-1 mt-2">Cantidad mínima para Precio {num}</label>
                    <input
                    type="number"
                    name={`price${num}MinQty`}
                    value={editedProduct?.[`price${num}MinQty` as PriceMinQtyKey]?.toString() ?? ''}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-800 rounded"
                    required
                    />
                </div>
                ))}
              <div>
                <label className="block mb-1">Precio 4 (opcional)</label>
                <input
                  type="number"
                  name="price4"
                  value={editedProduct?.price4 || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block mb-1">Precio 5 (opcional)</label>
                <input
                  type="number"
                  name="price5"
                  value={editedProduct?.price5 || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-800 rounded"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block mb-1">Ubicaciones de Stock</label>
                {editedProduct?.stockLocations.map((location, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                        type="text"
                        value={location.location}
                        onChange={(e) => handleStockLocationChange(index, 'location', e.target.value)}
                        className="w-1/3 p-2 bg-gray-800 rounded"
                        placeholder="Ubicación"
                    />
                    <input
                      type="number"
                      value={location.quantity !== null ? location.quantity : ''} 
                      onChange={(e) => handleStockLocationChange(index, 'quantity', e.target.value)}
                      className="w-1/3 p-2 bg-gray-800 rounded"
                      placeholder="Cantidad"
                    />
                    <button
                        type="button"
                        onClick={() => removeStockLocation(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                        Eliminar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStockLocation}
                  className="bg-green-500 text-white px-2 py-1 rounded mt-2"
                >
                  Añadir Ubicación
                </button>
              </div>
              <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4 flex flex-col justify-around items-center shadow-lg space-y-4 z-50">
                    <button 
                    type="submit" 
                    className="bg-yellow-400 text-black px-6 py-3 rounded-full hover:bg-yellow-300 transition-colors w-[95%]">
                    Guardar cambios
                    </button>
                    <button 
                    type="button" 
                    onClick={() => setSelectedProduct(null)} 
                    className="bg-gray-600 text-white px-6 py-3 rounded-full hover:bg-gray-500 transition-colors w-[95%]">
                    Cancelar
                    </button>
                </div>
            </form>
          )}
        </div>
      </div>

      {isConfirmed && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-green-500 text-xl font-bold">¡Producto actualizado exitosamente!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductPage;
