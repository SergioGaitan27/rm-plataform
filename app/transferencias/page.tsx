'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';

interface IProduct {
  _id: string;
  boxCode: string;
  productCode: string;
  name: string;
  imageUrl?: string;
  stockLocations: { location: string; quantity: number }[];
}

interface ITransfer {
  productId: string;
  productName: string;
  productCode: string;
  boxCode: string;
  imageUrl: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
}

const TransferenciaProductos = () => {
  const calculateTotal = (list: ITransfer[]): number => {
    return list.reduce((total, item) => total + item.quantity, 0);
  };

  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [transfer, setTransfer] = useState<ITransfer>({
    productId: '',
    productName: '',
    productCode: '',
    imageUrl: '',
    boxCode: '',
    fromLocation: '',
    toLocation: '',
    quantity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
  const [transferList, setTransferList] = useState<ITransfer[]>([]);
  const [transferImage, setTransferImage] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    };
    fetchProducts();
  }, []);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (status === 'unauthenticated' || !session) {
    router.push('/login');
    return null;
  }

  const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowProductList(e.target.value.length > 0);
  };

  const handleProductSelect = (product: IProduct) => {
    setSelectedProduct(product);
    setTransfer(prev => ({
      ...prev,
      productId: product._id,
      productName: product.name,
      productCode: product.productCode,
      boxCode: product.boxCode,
      imageUrl: product.imageUrl || ''
    }));
    setSearchTerm('');
    setShowProductList(false);
    setErrorMessage(''); // Reset error message on product select
  };

  const handleTransferChange = (field: keyof ITransfer, value: string | number) => {
    setTransfer(prev => {
      const newTransfer = { ...prev, [field]: value };

      if (field === 'quantity' || field === 'fromLocation') {
        const fromLocation = selectedProduct?.stockLocations.find(loc => loc.location === newTransfer.fromLocation);
        const availableQuantity = fromLocation?.quantity || 0;

        if (typeof newTransfer.quantity === 'number' && newTransfer.quantity > availableQuantity) {
          newTransfer.quantity = availableQuantity;
        }
      }

      return newTransfer;
    });
  };

  const handleAddNewLocation = () => {
    if (newLocation && selectedProduct) {
      const updatedProduct = {
        ...selectedProduct,
        stockLocations: [...selectedProduct.stockLocations, { location: newLocation, quantity: 0 }]
      };
      setSelectedProduct(updatedProduct);
      setTransfer(prev => ({ ...prev, toLocation: newLocation }));
      setNewLocation('');
      setIsAddingNewLocation(false);
    }
  };

  const handleAddToTransferList = () => {
    // Check for duplicate products in the transfer list
    const isDuplicate = transferList.some(item => item.productId === transfer.productId && item.fromLocation === transfer.fromLocation && item.toLocation === transfer.toLocation);

    if (isDuplicate) {
      setErrorMessage('El producto ya está en la lista con la misma ubicación de origen y destino.');
      return;
    }

    if (selectedProduct && transfer.fromLocation && transfer.toLocation && transfer.quantity > 0) {
      setTransferList(prev => [...prev, transfer]);
      setSelectedProduct(null);
      setTransfer({
        productId: '',
        productName: '',
        productCode: '',
        imageUrl: '',
        boxCode: '',
        fromLocation: '',
        toLocation: '',
        quantity: 0
      });
      setSearchTerm('');
    }
  };

  const handleRemoveFromTransferList = (index: number) => {
    setTransferList(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTransferImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = '';
      if (transferImage) {
        const formData = new FormData();
        formData.append('file', transferImage);
        formData.append('upload_preset', 'xgmwzgac');

        const imageResponse = await fetch('https://api.cloudinary.com/v1_1/dpsrtoyp7/image/upload', {
          method: 'POST',
          body: formData
        });

        if (!imageResponse.ok) {
          throw new Error('Error al subir la imagen de evidencia');
        }

        const imageData = await imageResponse.json();
        imageUrl = imageData.secure_url;
      }

      const transferData = {
        transfers: transferList,
        evidenceImageUrl: imageUrl
      };

      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const responseData = await response.json();
      const pdfBase64 = responseData.pdfUrl.split(',')[1]; // Extract the base64 part

      // Convert base64 to Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create a URL for the Blob
      const pdfUrl = URL.createObjectURL(blob);

      // Open or download the PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', 'TransferenciaProductos.pdf'); // Set filename for download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsConfirmed(true);
      setTimeout(() => {
        setTransferList([]);
        setTransferImage(null);
        setIsConfirmed(false);
      }, 2000);
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

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4">
      <h1 className="text-3xl font-bold mb-6">Transferencia de Productos</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 rounded-lg p-4 border border-yellow-400">
          <h2 className="text-xl font-semibold mb-4">Buscar producto</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, código de producto o código de caja"
              value={searchTerm}
              onChange={handleProductSearch}
              className="w-full p-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
            />
            {showProductList && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-yellow-400 rounded max-h-60 overflow-y-auto">
                {products
                  .filter(product => 
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.boxCode.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      className="cursor-pointer p-2 hover:bg-gray-700"
                    >
                      {product.boxCode} | {product.name} 
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {selectedProduct && (
          <div className="bg-gray-900 rounded-lg p-4 border border-yellow-400">
            <h2 className="text-xl font-semibold mb-4">Detalles de Transferencia</h2>
            <h3 className="text-lg font-semibold mb-2">Producto Seleccionado:</h3>
            <p className="mb-4 text-yellow-400">{selectedProduct.boxCode} | {selectedProduct.name}</p>
            <h3 className="text-lg font-semibold mb-2">Stock Actual:</h3>
            {selectedProduct.stockLocations.map((loc, index) => (
              <div key={index} className="mb-2">
                {loc.location}: {loc.quantity}
              </div>
            ))}
            <select
              value={transfer.fromLocation}
              onChange={(e) => handleTransferChange('fromLocation', e.target.value)}
              className="w-full p-2 mb-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400"
            >
              <option value="">Seleccione ubicación origen</option>
              {selectedProduct.stockLocations.map((loc, index) => (
                <option key={index} value={loc.location}>
                  {loc.location} (Cantidad: {loc.quantity})
                </option>
              ))}
            </select>
            
            <div className="relative mb-2">
              <select
                value={transfer.toLocation}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsAddingNewLocation(true);
                  } else {
                    handleTransferChange('toLocation', e.target.value);
                  }
                }}
                className="w-full p-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400"
              >
                <option value="">Seleccione ubicación destino</option>
                {selectedProduct.stockLocations.map((loc, index) => (
                  <option key={index} value={loc.location}>
                    {loc.location}
                  </option>
                ))}
                <option value="new">+ Agregar nueva ubicación</option>
              </select>
            </div>

            {isAddingNewLocation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-6 rounded-lg border border-yellow-400 w-3/4 max-w-md">
                  <h3 className="text-xl font-semibold mb-4">Agregar nueva ubicación</h3>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Nueva ubicación"
                    className="w-full p-2 mb-4 bg-gray-800 border border-yellow-400 rounded text-yellow-400"
                  />
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleAddNewLocation}
                      className="bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewLocation(false)}
                      className="bg-gray-600 text-yellow-400 p-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              type="number"
              placeholder="Cantidad a transferir"
              value={transfer.quantity || ''}
              onChange={(e) => handleTransferChange('quantity', e.target.value === '' ? 0 : parseInt(e.target.value))}
              max={selectedProduct.stockLocations.find(loc => loc.location === transfer.fromLocation)?.quantity || 0}
              className="w-full p-2 mb-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400 placeholder-yellow-400 placeholder-opacity-50"
            />

            <button
              type="button"
              onClick={handleAddToTransferList}
              disabled={!transfer.fromLocation || !transfer.toLocation || transfer.quantity <= 0}
              className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Agregar a la lista de transferencias
            </button>

            {errorMessage && (
              <div className="mt-2 text-red-500 font-semibold">{errorMessage}</div>
            )}
          </div>
        )}

        {transferList.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4 border border-yellow-400">
            <h2 className="text-2xl font-bold mb-4 text-center">Total de productos a transferir: {calculateTotal(transferList)}</h2>
            {transferList.map((item, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-800 rounded-lg shadow-lg">
                <div className="flex">
                  <div className="w-1/3 pr-4">
                    {item.imageUrl && (
                      <div className="relative w-full h-40">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-2/3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.productName}</h3>
                      <p><span className="font-semibold">Código de Producto:</span> {item.productCode}</p>
                      <p><span className="font-semibold">Código de Caja:</span> {item.boxCode}</p>
                    </div>
                    <div className="mt-2">
                      <p><span className="font-semibold">Desde:</span> {item.fromLocation}</p>
                      <p><span className="font-semibold">Hacia:</span> {item.toLocation}</p>
                      <p><span className="font-semibold">Cantidad:</span> {item.quantity}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromTransferList(index)}
                        className="mt-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 bg-gray-900 rounded-lg p-4 border border-yellow-400">
          <h3 className="text-xl font-semibold mb-4">Imagen de evidencia:</h3>
          <div className="relative">
            <input
              type="file"
              id="evidenceImage"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="evidenceImage"
              className="w-full p-2 bg-gray-800 border border-yellow-400 rounded text-yellow-400 cursor-pointer flex justify-between items-center"
            >
              <span className="text-yellow-400 opacity-50">
                {transferImage ? transferImage.name : "Seleccionar archivo"}
              </span>
              <span className="bg-yellow-400 text-black px-2 py-1 rounded text-sm">
                Seleccionar
              </span>
            </label>
          </div>
          {transferImage && (
            <div className="mt-2 relative w-full h-64 bg-gray-800 border border-yellow-400 rounded overflow-hidden">
              <Image
                src={URL.createObjectURL(transferImage)}
                alt="Vista previa de la evidencia"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
        <button 
          type="submit" 
          disabled={isLoading || transferList.length === 0}
          className="w-full bg-yellow-400 text-black p-2 rounded hover:bg-yellow-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Transfiriendo...' : 'Realizar Transferencias'}
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
            <p className="text-green-500 text-xl font-bold">¡Transferencias realizadas exitosamente!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferenciaProductos;
