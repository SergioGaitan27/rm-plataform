'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface IStockLocation {
  location: string;
  quantity: number;
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
  stockLocations: IStockLocation[];
  imageUrl?: string;
}

interface CartItem extends Product {
  quantity: number;
  unitType: 'pieces' | 'boxes';
}

const SalesPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [unitType, setUnitType] = useState<'pieces' | 'boxes'>('pieces');
  const [searchTermTop, setSearchTermTop] = useState('');
  const [searchTermBottom, setSearchTermBottom] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productInfoBottom, setProductInfoBottom] = useState<Product | null>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const [productSearchedFromBottom, setProductSearchedFromBottom] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProducts();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSearchTop = () => {
    const result = products.find(product => 
      product.boxCode.toLowerCase() === searchTermTop.toLowerCase() ||
      product.productCode.toLowerCase() === searchTermTop.toLowerCase() ||
      product.name.toLowerCase().includes(searchTermTop.toLowerCase())
    );
  
    if (result) {
      setSelectedProduct(result);
      setProductInfoBottom(result);
  
      if (result.boxCode.toLowerCase() === searchTermTop.toLowerCase()) {
        setUnitType('boxes');
      } else if (result.productCode.toLowerCase() === searchTermTop.toLowerCase()) {
        setUnitType('pieces');
      }
    } else {
      setSelectedProduct(null);
      setProductInfoBottom(null);
      setProductSearchedFromBottom(false);
    }
  
    setSearchTermTop('');
  };

  const handleSearchBottom = (searchTerm: string) => {
    setSearchTermBottom(searchTerm);

    if (searchTerm === '') {
      setFilteredProducts([]); // Ocultar la lista si el campo de búsqueda está vacío
    } else {
      // Filtrar productos según el término de búsqueda
      const filtered = products.filter(product =>
        product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setFilteredProducts(filtered);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setProductInfoBottom(product);
    setSearchTermBottom(''); // Limpia el input después de seleccionar un producto
    setFilteredProducts([]); // Oculta la lista desplegable
    setProductSearchedFromBottom(true);
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      const updatedCart = [...cart];
      const selectedUnitType = unitType;
  
      const existingItemIndex = updatedCart.findIndex(
        item => item._id === selectedProduct._id && item.unitType === selectedUnitType
      );
  
      if (existingItemIndex !== -1) {
        // If the item already exists in the cart, update its quantity
        updatedCart[existingItemIndex].quantity += quantity;
      } else {
        // If it's a new item, add it to the cart
        updatedCart.push({
          ...selectedProduct,
          quantity,
          unitType: selectedUnitType,
        });
      }
  
      setCart(updatedCart);
      setSelectedProduct(null);
      setQuantity(1);
      setUnitType('pieces');
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.quantity >= item.price3MinQty ? item.price3 :
                    item.quantity >= item.price2MinQty ? item.price2 : 
                    item.price1;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleKeyPressTop = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchTop();
    }
  };

  const handleKeyPressBottom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredProducts.length > 0) {
        handleSelectProduct(filteredProducts[0]);
      }
    }
  };

  const handleAddFromDetails = () => {
    if (productInfoBottom) {
      // Configurar el producto seleccionado en la parte superior izquierda
      setSelectedProduct(productInfoBottom);
      setUnitType('pieces');
      setQuantity(1);
      
      // Limpiar la información del producto en la sección inferior
      clearProductInfo();

      // Opcional: hacer foco en el campo de cantidad
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
      }
    }
  };

  const clearProductInfo = () => {
    setProductInfoBottom(null);
    setSearchTermBottom('');
    setProductSearchedFromBottom(false);
  };

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex">
      {/* Columna izquierda */}
      <div className="w-1/2 pr-2 flex flex-col">
        <div className="flex-1 bg-white p-4 mb-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Agregar productos</h2>
          
          <div className="mb-4 flex">
            <input
              type="text"
              placeholder="Ingrese código de caja ó código de producto"
              value={searchTermTop}
              onChange={(e) => setSearchTermTop(e.target.value)}
              onKeyDown={handleKeyPressTop} // Añade funcionalidad para buscar al presionar Enter
              className="flex-grow p-2 border rounded-l"
            />
            <button
              onClick={handleSearchTop}
              className="bg-blue-500 text-white px-4 py-2 rounded-r"
            >
              Buscar
            </button>
          </div>

          {selectedProduct && (
            <div className="flex items-start space-x-4">
              <div className="w-1/4">
                {selectedProduct.imageUrl ? (
                  <Image 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    width={100} 
                    height={100} 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-[100px] h-[100px] bg-gray-200 flex items-center justify-center">
                    No imagen
                  </div>
                )}
              </div>
              
              <span className="text-2xl font-bold self-center">×</span>
              
              <div className="w-1/4 self-center">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  ref={quantityInputRef}
                  onFocus={(e) => e.target.select()} // Seleccionar automáticamente el valor cuando se hace clic
                  className="w-full p-2 border rounded appearance-none" // Oculta las flechas de pasos
                />
              </div>
              
              <div className="flex flex-col space-y-2 w-1/4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pieces"
                    checked={unitType === 'pieces'}
                    onChange={() => setUnitType('pieces')}
                    className="mr-2"
                  />
                  Piezas
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="boxes"
                    checked={unitType === 'boxes'}
                    onChange={() => setUnitType('boxes')}
                    className="mr-2"
                  />
                  Cajas
                </label>
              </div>
            </div>
          )}
          
          {selectedProduct && (
            <button 
              onClick={handleAddToCart}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full mt-4"
            >
              Agregar
            </button>
          )}
        </div>
        
        {/* Sección inferior: Buscador y información detallada del producto */}
        <div className="flex-1 bg-white p-4 rounded shadow overflow-y-auto relative">
          <h2 className="text-xl font-bold mb-4">Información de productos</h2>
          
          <div className="mb-4 flex relative">
            <input
              type="text"
              placeholder="Buscar por código de caja, código de producto o nombre"
              value={searchTermBottom}
              onChange={(e) => handleSearchBottom(e.target.value)}
              onKeyDown={handleKeyPressBottom} // Añade funcionalidad para buscar al presionar Enter
              className="flex-grow p-2 border rounded-l"
            />
            <button
              onClick={() => handleSearchBottom(searchTermBottom)}
              className="bg-blue-500 text-white px-4 py-2 rounded-r"
            >
              Buscar
            </button>
            {filteredProducts.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded shadow-lg w-full mt-12 max-h-40 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <li
                    key={product._id}
                    onClick={() => handleSelectProduct(product)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {product.name} - {product.productCode} ({product.boxCode})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {productInfoBottom && (
            <div className="mt-4">
                <div className="flex space-x-4">
                <div className="w-1/4">
                    {productInfoBottom.imageUrl ? (
                    <Image 
                        src={productInfoBottom.imageUrl} 
                        alt={productInfoBottom.name} 
                        width={100} 
                        height={100} 
                        className="object-cover"
                    />
                    ) : (
                    <div className="w-[100px] h-[100px] bg-gray-200 flex items-center justify-center">
                        No imagen
                    </div>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-lg">{productInfoBottom.name}</h3>
                    <p>Código de caja: {productInfoBottom.boxCode}</p>
                    <p>Código de producto: {productInfoBottom.productCode}</p>
                    <p>Piezas por caja: {productInfoBottom.piecesPerBox}</p>
                    <p>Precio menudeo: ${productInfoBottom.price1.toFixed(2)} (Cantidad mínima: {productInfoBottom.price1MinQty})</p>
                    <p>Precio mayoreo: ${productInfoBottom.price2.toFixed(2)} (Cantidad mínima: {productInfoBottom.price2MinQty})</p>
                    <p>Precio caja: ${productInfoBottom.price3.toFixed(2)} (Cantidad mínima: {productInfoBottom.price3MinQty})</p>
                    {productInfoBottom.price4 && <p>Precio 4: ${productInfoBottom.price4.toFixed(2)}</p>}
                    {productInfoBottom.price5 && <p>Precio 5: ${productInfoBottom.price5.toFixed(2)}</p>}
                    <h4 className="font-bold mt-2">Ubicaciones de stock:</h4>
                    <ul>
                    {productInfoBottom.stockLocations.map((location, index) => (
                        <li key={index}>{location.location}: {location.quantity} unidades</li>
                    ))}
                    </ul>
                </div>
                </div>
                {productSearchedFromBottom && (
                <button 
                    onClick={handleAddFromDetails}
                    className="bg-green-500 text-white px-4 py-2 rounded mt-4 w-full"
                >
                    Agregar producto
                </button>
                )}
            </div>
            )}
        </div>
      </div>
      
      {/* Columna derecha: Previsualización del ticket */}
      <div className="w-1/2 pl-2">
        <div className="bg-white p-4 rounded shadow h-full overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Artículos en el carrito actualmente</h2>
          {cart.length > 0 ? (
            <div>
              {cart.map((item, index) => (
                <div key={index} className="mb-2 flex justify-between items-center">
                  <span>{item.name} - {item.quantity} {item.unitType}</span>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <div className="mt-4 font-bold text-xl">
                Total: ${calculateTotal().toFixed(2)}
              </div>
            </div>
          ) : (
            <p>El carrito está vacío.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
