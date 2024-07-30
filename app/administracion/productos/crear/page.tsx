// app/administracion/productos/crear/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BarcodeScanner } from '@/components/BarcodeScanner'; // Asegúrate de crear este componente

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
  price4: number | undefined;
  price5: number | undefined;
  stockLocations: StockLocation[];
  imageUrl?: string;
}


const CreateProductPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

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
    price4: 0,
    price5: 0,
    stockLocations: [],
  });

  const [newLocation, setNewLocation] = useState<StockLocation>({ location: '', quantity: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

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

  const handleCameraCapture = async () => {
    try {
      // Solicitar permiso para usar la cámara
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      
      // Crear un elemento de video para mostrar la vista previa de la cámara
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
  
      // Esperar a que el video esté listo
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
  
      // Crear un canvas para capturar la imagen
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
  
      // Capturar la imagen actual del video en el canvas
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      // Convertir el canvas a un archivo Blob
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve as BlobCallback, 'image/jpeg'));
  
      // Crear un archivo a partir del Blob
      const file = new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
  
      // Actualizar el estado con el nuevo archivo
      setImageFile(file);
  
      // Detener la transmisión de video
      stream.getTracks().forEach(track => track.stop());
  
    } catch (error) {
      console.error('Error al capturar la imagen:', error);
      // Aquí puedes manejar el error, por ejemplo, mostrando un mensaje al usuario
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setProduct({ ...product, productCode: barcode });
    setShowBarcodeScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lógica para subir la imagen y guardar el producto
    // (mantén el código que ya teníamos para esto)
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Crear Producto</h1>
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
              {showBarcodeScanner && <BarcodeScanner onScan={handleBarcodeScanned} />}
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
            </div>
          </fieldset>

          {/* Precios */}
          <fieldset className="border border-yellow-400 rounded p-4">
            <legend className="text-lg font-semibold">Precios</legend>
            <div className="space-y-2">
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
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex space-x-2">
                  <input
                    type="number"
                    name={`price${num}`}
                    value={product[`price${num}` as keyof ProductForm] as number}
                    onChange={handleInputChange}
                    placeholder={`Precio ${num}`}
                    className="w-1/2 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                    required
                    step="0.01"
                  />
                  <input
                    type="number"
                    name={`price${num}MinQty`}
                    value={product[`price${num}MinQty` as keyof ProductForm] as number}
                    onChange={handleInputChange}
                    placeholder={`Cant. mín. ${num}`}
                    className="w-1/2 p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                    required
                  />
                </div>
              ))}
              <input
                type="number"
                name="price4"
                value={product.price4?.toString() || ''}
                onChange={handleInputChange}
                placeholder="Precio 4 (opcional)"
                className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                step="0.01"
              />
              <input
                type="number"
                name="price5"
                value={product.price5?.toString() || ''}
                onChange={handleInputChange}
                placeholder="Precio 5 (opcional)"
                className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
                step="0.01"
              />
            </div>
          </fieldset>

          {/* Imagen del Producto */}
          <fieldset className="border border-yellow-400 rounded p-4">
            <legend className="text-lg font-semibold">Imagen del Producto</legend>
            <div className="space-y-2">
              {isMobile && (
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="w-full bg-yellow-400 text-black p-2 rounded mb-2"
                >
                  Tomar foto
                </button>
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 bg-gray-900 border border-yellow-400 rounded text-yellow-400"
              />
            </div>
          </fieldset>

          {/* Ubicaciones de Stock */}
          <fieldset className="border border-yellow-400 rounded p-4">
            <legend className="text-lg font-semibold">Ubicaciones de Stock</legend>
            <div className="space-y-2">
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
          </fieldset>

          <button type="submit" className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors">
            Guardar Producto
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProductPage;