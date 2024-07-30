// app/administracion/productos/crear/page.tsx
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface StockLocation {
  location: string;
  quantity: number;
}

interface ProductForm {
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

const CreateProductPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [product, setProduct] = useState<ProductForm>({
    boxCode: '',
    productCode: '',
    name: '',
    piecesPerBox: 0,
    cost: 0,
    price1: 0,
    price1MinQty: 0,
    price2: 0,
    price2MinQty: 0,
    price3: 0,
    price3MinQty: 0,
    stockLocations: [],
  });

  const [newLocation, setNewLocation] = useState<StockLocation>({ location: '', quantity: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: name.includes('price') || name === 'cost' || name === 'piecesPerBox' ? parseFloat(value) : value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLocation({ ...newLocation, [name]: name === 'quantity' ? parseInt(value) : value });
  };

  const addStockLocation = () => {
    if (newLocation.location && newLocation.quantity > 0) {
      setProduct({
        ...product,
        stockLocations: [...product.stockLocations, newLocation],
      });
      setNewLocation({ location: '', quantity: 0 });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Primero, subimos la imagen si existe
    let imageUrl = '';
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', 'tu_upload_preset'); // Reemplaza con tu upload preset de Cloudinary

      try {
        const response = await fetch('https://api.cloudinary.com/v1_1/tu_cloud_name/image/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Error al subir la imagen');
        }

        const data = await response.json();
        imageUrl = data.secure_url;
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        // Aquí puedes manejar el error, por ejemplo, mostrando un mensaje al usuario
        return;
      }
    }

    // Luego, guardamos el producto
    const productData = {
      ...product,
      imageUrl
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        throw new Error('Error al guardar el producto');
      }

      router.push('/administracion/productos');
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      // Aquí puedes manejar el error, por ejemplo, mostrando un mensaje al usuario
    }
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Crear Producto</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="boxCode"
            value={product.boxCode}
            onChange={handleInputChange}
            placeholder="Código de caja"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
          />
          <input
            type="text"
            name="productCode"
            value={product.productCode}
            onChange={handleInputChange}
            placeholder="Código de producto"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
          />
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
            value={product.piecesPerBox}
            onChange={handleInputChange}
            placeholder="Piezas por caja"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
          />
          <input
            type="number"
            name="cost"
            value={product.cost}
            onChange={handleInputChange}
            placeholder="Costo"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
            step="0.01"
          />
          <input
            type="number"
            name="price1"
            value={product.price1}
            onChange={handleInputChange}
            placeholder="Precio 1"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
            step="0.01"
          />
          <input
            type="number"
            name="price1MinQty"
            value={product.price1MinQty}
            onChange={handleInputChange}
            placeholder="Cantidad mínima para Precio 1"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
          />
          <input
            type="number"
            name="price2"
            value={product.price2}
            onChange={handleInputChange}
            placeholder="Precio 2"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
            step="0.01"
          />
          <input
            type="number"
            name="price2MinQty"
            value={product.price2MinQty}
            onChange={handleInputChange}
            placeholder="Cantidad mínima para Precio 2"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
          />
          <input
            type="number"
            name="price3"
            value={product.price3}
            onChange={handleInputChange}
            placeholder="Precio 3"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
            step="0.01"
          />
          <input
            type="number"
            name="price3MinQty"
            value={product.price3MinQty}
            onChange={handleInputChange}
            placeholder="Cantidad mínima para Precio 3"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            required
          />
          <input
            type="number"
            name="price4"
            value={product.price4 || ''}
            onChange={handleInputChange}
            placeholder="Precio 4 (opcional)"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            step="0.01"
          />
          <input
            type="number"
            name="price5"
            value={product.price5 || ''}
            onChange={handleInputChange}
            placeholder="Precio 5 (opcional)"
            className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            step="0.01"
          />
          <div>
            <label htmlFor="image" className="block mb-2">Imagen del producto</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
            />
          </div>
          <div>
            <h3 className="font-bold mb-2">Ubicaciones de stock</h3>
            {product.stockLocations.map((loc, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <span>{loc.location}: {loc.quantity}</span>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                name="location"
                value={newLocation.location}
                onChange={handleLocationChange}
                placeholder="Ubicación"
                className="w-1/2 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
              />
              <input
                type="number"
                name="quantity"
                value={newLocation.quantity}
                onChange={handleLocationChange}
                placeholder="Cantidad"
                className="w-1/4 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
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
          <button type="submit" className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors">
            Guardar Producto
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProductPage;