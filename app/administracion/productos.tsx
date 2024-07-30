// pages/administracion/productos.tsx
'use client';

import React, { useState } from 'react';

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

const ProductAdminPage: React.FC = () => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLocation({ ...newLocation, [name]: value });
  };

  const addStockLocation = () => {
    setProduct({
      ...product,
      stockLocations: [...product.stockLocations, newLocation],
    });
    setNewLocation({ location: '', quantity: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar los datos al servidor
    console.log(product);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Administración de Productos</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="boxCode"
          value={product.boxCode}
          onChange={handleInputChange}
          placeholder="Código de caja"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="productCode"
          value={product.productCode}
          onChange={handleInputChange}
          placeholder="Código de producto"
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleInputChange}
          placeholder="Nombre del producto"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          name="piecesPerBox"
          value={product.piecesPerBox}
          onChange={handleInputChange}
          placeholder="Piezas por caja"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          name="cost"
          value={product.cost}
          onChange={handleInputChange}
          placeholder="Costo"
          className="w-full p-2 border rounded"
        />
        {/* Agregar campos para price1, price1MinQty, price2, price2MinQty, price3, price3MinQty */}
        <input
          type="number"
          name="price1"
          value={product.price1}
          onChange={handleInputChange}
          placeholder="Precio 1"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          name="price1MinQty"
          value={product.price1MinQty}
          onChange={handleInputChange}
          placeholder="Cantidad mínima para Precio 1"
          className="w-full p-2 border rounded"
        />
        {/* Repetir para price2, price2MinQty, price3, price3MinQty */}
        <input
          type="text"
          name="imageUrl"
          value={product.imageUrl || ''}
          onChange={handleInputChange}
          placeholder="URL de la imagen"
          className="w-full p-2 border rounded"
        />
        
        <div>
          <h3 className="font-bold">Ubicaciones de stock</h3>
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
              className="w-1/2 p-2 border rounded"
            />
            <input
              type="number"
              name="quantity"
              value={newLocation.quantity}
              onChange={handleLocationChange}
              placeholder="Cantidad"
              className="w-1/4 p-2 border rounded"
            />
            <button
              type="button"
              onClick={addStockLocation}
              className="bg-green-500 text-white p-2 rounded"
            >
              Agregar ubicación
            </button>
          </div>
        </div>
        
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Guardar Producto
        </button>
      </form>
    </div>
  );
};

export default ProductAdminPage;