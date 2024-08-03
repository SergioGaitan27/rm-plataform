'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import BottomNavBar from '@/components/BottomNavBar';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), {
  ssr: false,
});

interface StockLocation {
  location: string;
  quantity: number | undefined;
}

interface ProductForm {
  boxCode: string;
  productCode: string;
  name: string;
  piecesPerBox: number | undefined;
  cost: number | undefined;
  price1: number | undefined;
  price1MinQty: number | undefined;
  price2: number | undefined;
  price2MinQty: number | undefined;
  price3: number | undefined;
  price3MinQty: number | undefined;
  price4: number | undefined;
  price5: number | undefined;
  stockLocations: StockLocation[];
  imageUrl?: string;
}

type PrecioPlaceholders = {
  [key: number]: string;
};

type Category = {
  name: string;
  allowedRoles: string[];
  icon: string;
};

const precioPlaceholders: PrecioPlaceholders = {
  1: "Precio menudeo",
  2: "Precio mayoreo",
  3: "Precio caja",
  4: "Precio 4 (opcional)",
  5: "Precio 5 (opcional)"
};

const CreateProductPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [product, setProduct] = useState<ProductForm>({
    boxCode: '',
    productCode: '',
    name: '',
    piecesPerBox: undefined,
    cost: undefined,
    price1: undefined,
    price1MinQty: undefined,
    price2: undefined,
    price2MinQty: undefined,
    price3: undefined,
    price3MinQty: undefined,
    price4: undefined,
    price5: undefined,
    stockLocations: [],
  });

  const [newLocation, setNewLocation] = useState<StockLocation>({ location: '', quantity: undefined });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!session) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value === '' ? undefined : 
        (name.includes('price') || name === 'cost' || name.includes('MinQty') || name === 'piecesPerBox') 
          ? (value === '' ? undefined : Number(value))
          : value.toUpperCase()
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLocation(prev => ({
      ...prev,
      [name]: name === 'quantity' ? (value === '' ? undefined : parseInt(value)) : value.toUpperCase()
    }));
  };

  const addStockLocation = () => {
    if (newLocation.location && newLocation.quantity !== undefined && newLocation.quantity > 0) {
      setProduct({
        ...product,
        stockLocations: [...product.stockLocations, newLocation],
      });
      setNewLocation({ location: '', quantity: undefined });
    }
  };

  const getInputValue = (value: any): string => {
    if (value === undefined || value === null) {
      return '';
    }
    return value.toString();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      await setProduct(prev => ({ ...prev, productCode: barcode }));
      setShowBarcodeScanner(false);
    } catch (error) {
      setError('Hubo un problema al escanear el código de barras. Por favor, intenta de nuevo.');
      console.error('Error al manejar el código de barras:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', 'xgmwzgac');

        const imageResponse = await fetch('https://api.cloudinary.com/v1_1/dpsrtoyp7/image/upload', {
          method: 'POST',
          body: formData
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          throw new Error(`Error al subir la imagen: ${errorText}`);
        }

        const imageData = await imageResponse.json();
        imageUrl = imageData.secure_url;
      }

      const productData = {
        ...product,
        imageUrl
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el producto');
      }

      const savedProduct = await response.json();
      console.log('Producto guardado:', savedProduct);

      setIsLoading(false);
      setIsConfirmed(true);

      setTimeout(() => {
        setProduct({
          boxCode: '',
          productCode: '',
          name: '',
          piecesPerBox: undefined,
          cost: undefined,
          price1: undefined,
          price1MinQty: undefined,
          price2: undefined,
          price2MinQty: undefined,
          price3: undefined,
          price3MinQty: undefined,
          price4: undefined,
          price5: undefined,
          stockLocations: [],
        });
        setImageFile(null);
        setIsConfirmed(false);
        router.push('/catalogo');
      }, 2000);

    } catch (error) {
      console.error('Error al crear el producto:', error);
      setIsLoading(false);
      setError('Hubo un error al guardar el producto. Por favor, intenta de nuevo.');
    }
  };

  const userRole = session.user?.role;
  const userCategories = categories.filter(category =>
    category.allowedRoles.includes(userRole as string)
  );

  return (
    <>
    {!isLoading && (
      <div className="min-h-screen bg-black text-yellow-400 flex flex-col justify-between">
        <div className="min-h-screen bg-black text-yellow-400 p-4">
          <div className="max-w-md mx-auto relative">
            <h1 className="text-2xl font-bold mb-6">Crear Producto</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos del Producto */}
              <fieldset className="border border-yellow-400 rounded p-4">
                <legend className="text-lg font-semibold">Datos del Producto</legend>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="boxCode"
                    value={product.boxCode}
                    onChange={handleInputChange}
                    placeholder="Código de caja"
                    className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                    required
                  />
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="productCode"
                      value={product.productCode}
                      onChange={handleInputChange}
                      placeholder="Código de producto"
                      className="flex-grow p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="bg-yellow-400 text-black p-2 rounded"
                    >
                      Escanear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {showBarcodeScanner && <BarcodeScanner onScan={handleBarcodeScanned} />}
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleInputChange}
                    placeholder="Nombre del producto"
                    className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                    required
                  />
                  <input
                    type="number"
                    name="piecesPerBox"
                    value={getInputValue(product.piecesPerBox)}
                    onChange={handleInputChange}
                    placeholder="Piezas por caja"
                    className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                    required
                  />
                </div>
              </fieldset>

              {/* Precios */}
              <fieldset className="border border-yellow-400 rounded p-4">
                <legend className="text-lg font-semibold">Precios</legend>
                <div className="space-y-2">
                  <input
                    type="number"
                    name="cost"
                    value={getInputValue(product.cost)}
                    onChange={handleInputChange}
                    placeholder="Costo"
                    className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
                    required
                    step="0.01"
                  />
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="flex space-x-2">
                      <input
                        type="number"
                        name={`price${num}`}
                        value={getInputValue(product[`price${num}` as keyof ProductForm])}
                        onChange={handleInputChange}
                        placeholder={precioPlaceholders[num] || `Precio ${num}`}
                        className="w-1/2 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
                        required
                        step="0.01"
                      />
                      <input
                        type="number"
                        name={`price${num}MinQty`}
                        value={getInputValue(product[`price${num}MinQty` as keyof ProductForm])}
                        onChange={handleInputChange}
                        placeholder={`Cantidad mínima`}
                        className="w-1/2 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
                        required
                      />
                    </div>
                  ))}
                  <input
                    type="number"
                    name="price4"
                    value={getInputValue(product.price4)}
                    onChange={handleInputChange}
                    placeholder={precioPlaceholders[4]}
                    className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
                    step="0.01"
                  />
                  <input
                    type="number"
                    name="price5"
                    value={getInputValue(product.price5)}
                    onChange={handleInputChange}
                    placeholder={precioPlaceholders[5]}
                    className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
                    step="0.01"
                  />
                </div>
              </fieldset>

              {/* Ubicaciones de Stock */}
              <fieldset className="border border-yellow-400 rounded p-4">
                <legend className="text-lg font-semibold">Ubicaciones de Stock</legend>
                <div className="space-y-2">
                  {product.stockLocations.map((loc, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <span>{loc.location}: {loc.quantity ?? 'N/A'}</span>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="location"
                      value={newLocation.location}
                      onChange={handleLocationChange}
                      placeholder="Ubicación"
                      className="w-1/2 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
                    />
                    <input
                      type="number"
                      name="quantity"
                      value={getInputValue(newLocation.quantity)}
                      onChange={handleLocationChange}
                      placeholder="Cantidad"
                      className="w-1/4 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
                    />
                    <button
                      type="button"
                      onClick={addStockLocation}
                      className="bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </fieldset>

              {/* Imagen del Producto */}
              <fieldset className="border border-yellow-400 rounded p-4 mb-20">
                <legend className="text-lg font-semibold">Imagen del Producto</legend>
                <div className="space-y-2">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                  />
                  {imageFile && (
                    <div className="mt-2 relative w-full h-64">
                      <Image
                        src={URL.createObjectURL(imageFile)}
                        alt="Vista previa del producto"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>
              </fieldset>

              <button 
                type="submit" 
                className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </form>

            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-400"></div>
              </div>
            )}

            {isConfirmed && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl">
                  <p className="text-green-500 text-xl font-bold">¡Producto guardado exitosamente!</p>
                </div>
              </div>
            )}
          </div> 
        </div>
        <BottomNavBar categories={userCategories} />
      </div>
    )}
  </>
  );
};

export default CreateProductPage;