"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductCard from '@/components/ProductCard'; 
import { toast } from 'react-hot-toast';

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
  category: string;
  availability: boolean;
}

interface CartItem extends Product {
  quantity: number;
  unitType: 'pieces' | 'boxes';
  appliedPrice: number;
}

const groupCartItems = (cart: CartItem[]): Record<string, CartItem[]> => {
  return cart.reduce((acc, item) => {
    if (!acc[item._id]) {
      acc[item._id] = [];
    }
    acc[item._id].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);
};

const calculateProductTotals = (items: CartItem[]): {
  boxes: number;
  loosePieces: number;
  totalPieces: number;
} => {
  let boxes = 0;
  let loosePieces = 0;

  items.forEach(item => {
    if (item.unitType === 'boxes') {
      boxes += item.quantity;
      loosePieces += (item.quantity * item.piecesPerBox) % item.piecesPerBox;
    } else {
      loosePieces += item.quantity;
    }
  });

  const totalPieces = boxes * items[0].piecesPerBox + loosePieces;
  
  // Convertir piezas sueltas a cajas si es posible
  const additionalBoxes = Math.floor(loosePieces / items[0].piecesPerBox);
  boxes += additionalBoxes;
  loosePieces = loosePieces % items[0].piecesPerBox;

  return { boxes, loosePieces, totalPieces };
};

const SalesPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserLocation();
      fetchProducts();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, session]);

  const fetchUserLocation = async () => {
    try {
      const response = await fetch('/api/user/location');
      if (!response.ok) {
        throw new Error('Error al obtener la ubicación del usuario');
      }
      const data = await response.json();
      setUserLocation(data.location);
    } catch (error) {
      console.error('Error:', error);
    }
  };

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

  const isProductAvailableInLocation = (product: Product): boolean => {
    return product.stockLocations.some(location => 
      location.location === userLocation && location.quantity > 0
    );
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
      setFilteredProducts([]);
    } else {
      const filtered = products.filter(product =>
        product.boxCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setFilteredProducts(filtered);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setProductInfoBottom(product);
    setSearchTermBottom('');
    setFilteredProducts([]);
    setProductSearchedFromBottom(true);
  };

  const handleSearchTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermTop(e.target.value.toUpperCase());
  };

  const handleSearchBottomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperCaseValue = e.target.value.toUpperCase();
    setSearchTermBottom(upperCaseValue);
    handleSearchBottom(upperCaseValue);
  };

  const calculatePrice = (product: Product, totalQuantity: number): number => {
    if (totalQuantity >= product.price3MinQty) return product.price3;
    if (totalQuantity >= product.price2MinQty) return product.price2;
    if (totalQuantity >= product.price1MinQty) return product.price1;
    return product.price1;
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      if (isProductAvailableInLocation(selectedProduct)) {
        const updatedCart = [...cart];
        const totalPieces = unitType === 'boxes' ? quantity * selectedProduct.piecesPerBox : quantity;
        
        const existingCartItems = updatedCart.filter(item => item._id === selectedProduct._id);
        const existingTotalPieces = existingCartItems.reduce((total, item) => {
          return total + (item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity);
        }, 0);
        
        const newTotalPieces = existingTotalPieces + totalPieces;
        const appliedPrice = calculatePrice(selectedProduct, newTotalPieces);

        if (unitType === 'boxes') {
          const existingBoxItem = existingCartItems.find(item => item.unitType === 'boxes');
          if (existingBoxItem) {
            existingBoxItem.quantity += quantity;
            existingBoxItem.appliedPrice = appliedPrice;
          } else {
            updatedCart.push({
              ...selectedProduct,
              quantity,
              unitType: 'boxes',
              appliedPrice,
            });
          }
        } else {
          const existingPieceItem = existingCartItems.find(item => item.unitType === 'pieces');
          if (existingPieceItem) {
            existingPieceItem.quantity += quantity;
            existingPieceItem.appliedPrice = appliedPrice;
          } else {
            updatedCart.push({
              ...selectedProduct,
              quantity,
              unitType: 'pieces',
              appliedPrice,
            });
          }
        }

        updatedCart.forEach(item => {
          if (item._id === selectedProduct._id) {
            item.appliedPrice = appliedPrice;
          }
        });

        setCart(updatedCart);
        setSelectedProduct(null);
        setQuantity(1);
        setUnitType('pieces');
      } else {
        toast.error('Este producto no está disponible en tu ubicación o no tiene inventario.');
      }
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.unitType === 'boxes'
        ? item.appliedPrice * item.quantity * item.piecesPerBox
        : item.appliedPrice * item.quantity;
      return total + itemTotal;
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
      setSelectedProduct(productInfoBottom);
      setUnitType('pieces');
      setQuantity(1);
      clearProductInfo();
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

  const calculateStockDisplay = (stockLocations: IStockLocation[], piecesPerBox: number) => {
    return stockLocations.map(location => {
      const boxes = Math.floor(location.quantity / piecesPerBox);
      const loosePieces = location.quantity % piecesPerBox;
      return {
        location: location.location,
        boxes,
        loosePieces,
        total: location.quantity
      };
    });
  };

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
    setAmountPaid('');
    setChange(0);
    setPaymentType('cash');
  };

  useEffect(() => {
    if (isPaymentModalOpen && paymentType === 'cash') {
      const timeoutId = setTimeout(() => {
        amountPaidInputRef.current?.focus();
      }, 100);
  
      return () => clearTimeout(timeoutId);
    }
  }, [isPaymentModalOpen, paymentType]);

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentType('cash');
    setAmountPaid('');
    setChange(0);
  };

  const handlePaymentTypeChange = (value: 'cash' | 'card') => {
    setPaymentType(value);
    if (value === 'card') {
      setAmountPaid(calculateTotal().toFixed(2));
      setChange(0);
    } else {
      setAmountPaid('');
      setChange(0); 
      // Enfocamos el input cuando cambiamos a efectivo
      setTimeout(() => {
        amountPaidInputRef.current?.focus();
      }, 0);
    }
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setAmountPaid(inputValue);
    
    const paid = parseFloat(inputValue) || 0;
    const total = calculateTotal();
    setChange(paid - total);
  };

  const getChangeText = () => {
    if (amountPaid === '') return '';
    if (change === 0) return "Monto exacto";
    if (change > 0) return `Cambio: $${change.toFixed(2)}`;
    return `Falta: $${Math.abs(change).toFixed(2)}`;
  };

  const getChangeTextColor = () => {
    if (amountPaid === '') return '';
    if (change === 0) return "text-green-500";
    if (change > 0) return "text-blue-500";
    return "text-red-500";
  };

  const handlePayment = async () => {
    setIsLoading(true);
    const ticketData = {
      items: cart.map(item => ({
        productId: item._id,
        productName: item.name,
        quantity: item.quantity,
        unitType: item.unitType,
        pricePerUnit: item.appliedPrice,
        total: item.appliedPrice * item.quantity * (item.unitType === 'boxes' ? item.piecesPerBox : 1)
      })),
      totalAmount: calculateTotal(),
      paymentType,
      amountPaid: parseFloat(amountPaid),
      change
    };

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el ticket');
      }

      const data = await response.json();

      // Actualizar los productos en el estado local
      setProducts(prevProducts => {
        const updatedProducts = [...prevProducts];
        data.updatedProducts.forEach((updatedProduct: Product) => {
          const index = updatedProducts.findIndex(p => p._id === updatedProduct._id);
          if (index !== -1) {
            updatedProducts[index] = updatedProduct;
          }
        });
        return updatedProducts;
      });

      // Limpiar el carrito y cerrar el modal de pago
      handleClosePaymentModal();
      setCart([]);
      
      // Mostrar mensaje de éxito
      toast.success('Pago procesado exitosamente');

      // Limpiar la información del producto seleccionado
      setProductInfoBottom(null);
      setSearchTermBottom('');
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  return (
    <div className="h-screen bg-background text-foreground p-4 flex overflow-hidden">
      {/* Columna izquierda */}
      <div className="w-1/2 pr-2 flex flex-col space-y-4">
        <Card className="flex-shrink-0 flex flex-col">
          <CardHeader>
            <CardTitle>Agregar productos</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <div className="mb-4 mt-4 flex">
              <Input
                type="text"
                placeholder="Ingrese código de caja, código de producto o categoría"
                value={searchTermTop}
                onChange={handleSearchTopChange}
                onKeyDown={handleKeyPressTop}
                className="flex-grow"
              />
              <Button
                onClick={handleSearchTop}
                className="ml-2"
              >
                Buscar
              </Button>
            </div>

            {selectedProduct && (
              <ProductCard
              product={selectedProduct}
              quantity={quantity}
              unitType={unitType}
              onQuantityChange={setQuantity}
              onUnitTypeChange={(value: 'pieces' | 'boxes') => setUnitType(value)}
              onAddToCart={handleAddToCart}
              isAvailable={isProductAvailableInLocation(selectedProduct)}
              />
            )}
          </CardContent>
        </Card>
       
        <Card className="flex-grow overflow-hidden flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Información de productos</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <div className="mb-4 mt-4 flex relative">
              <Input
                type="text"
                placeholder="Buscar por código, nombre o categoría"
                value={searchTermBottom}
                onChange={handleSearchBottomChange}
                onKeyDown={handleKeyPressBottom}
                className="flex-grow"
              />
              <Button
                onClick={() => handleSearchBottom(searchTermBottom)}
                className="ml-2"
              >
                Buscar
              </Button>
              {filteredProducts.length > 0 && (
                <ul className="absolute z-10 bg-white border rounded shadow-lg w-full mt-12 max-h-40 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <li
                      key={product._id}
                      onClick={() => handleSelectProduct(product)}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {product.name} | {product.productCode} | ({product.boxCode})
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
                    <p>Categoría: {productInfoBottom.category}</p>
                    <p>Disponibilidad: {productInfoBottom.availability ? 'Disponible' : 'No disponible'}</p>
                    <p>Piezas por caja: {productInfoBottom.piecesPerBox}</p>
                    <p>Precio menudeo: ${productInfoBottom.price1.toFixed(2)} (Cantidad mínima: {productInfoBottom.price1MinQty})</p>
                    <p>Precio mayoreo: ${productInfoBottom.price2.toFixed(2)} (Cantidad mínima: {productInfoBottom.price2MinQty})</p>
                    <p>Precio caja: ${productInfoBottom.price3.toFixed(2)} (Cantidad mínima: {productInfoBottom.price3MinQty})</p>
                    {productInfoBottom.price4 && <p>Precio 4: ${productInfoBottom.price4.toFixed(2)}</p>}
                    {productInfoBottom.price5 && <p>Precio 5: ${productInfoBottom.price5.toFixed(2)}</p>}
                    <h4 className="font-bold mt-2">Ubicaciones de stock:</h4>
                    <ul>
                      {calculateStockDisplay(productInfoBottom.stockLocations, productInfoBottom.piecesPerBox).map((location, index) => (
                        <li key={index}>
                          {location.location}: 
                          {location.boxes > 0 && ` ${location.boxes} ${location.boxes === 1 ? 'caja' : 'cajas'}`}
                          {location.boxes > 0 && location.loosePieces > 0 && ' y'}
                          {location.loosePieces > 0 && ` ${location.loosePieces} ${location.loosePieces === 1 ? 'pieza' : 'piezas'}`}
                          {' | Total: '}{location.total} {location.total === 1 ? 'pieza' : 'piezas'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {productSearchedFromBottom && (
                  <Button 
                    onClick={handleAddFromDetails}
                    className="bg-green-500 text-white px-4 py-2 rounded mt-4 w-full"
                  >
                    Agregar producto
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Columna derecha */}
      <div className="w-1/2 pl-2 flex flex-col overflow-hidden">
        <Card className="flex-grow flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Artículos en el carrito</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto pb-20">
            {cart.length > 0 ? (
              <div>
                {Object.entries(groupCartItems(cart)).map(([productId, items]) => {
                  const { boxes, loosePieces, totalPieces } = calculateProductTotals(items);
                  const appliedPrice = items[0].appliedPrice;
                  return (
                    <div key={productId} className="mb-4 p-3 bg-gray-100 rounded-lg">
                      <h3 className="font-bold text-lg mb-2">{items[0].name}</h3>
                      <p>
                        {boxes > 0 && `${boxes} ${boxes === 1 ? 'caja' : 'cajas'} (${boxes * items[0].piecesPerBox} ${boxes * items[0].piecesPerBox === 1 ? 'pieza' : 'piezas'})`}
                        {boxes > 0 && loosePieces > 0 && ' + '}
                        {loosePieces > 0 && `${loosePieces} ${loosePieces === 1 ? 'pieza' : 'piezas'}`}
                        {' = '}
                        <span className="font-bold">{totalPieces} {totalPieces === 1 ? 'pieza' : 'piezas'} en total</span>
                      </p>
                      <p className="mt-1">Precio aplicado: ${appliedPrice.toFixed(2)} por pieza</p>
                      <p className="font-bold">Subtotal: ${(appliedPrice * totalPieces).toFixed(2)}</p>
                      <div className="mt-2 flex justify-end">
                        <Button
                          onClick={() => removeFromCart(items[0]._id)}
                          variant="destructive"
                          size="sm"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>El carrito está vacío.</p>
            )}
          </CardContent>
        </Card>
        {/* Total fijo */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 right-0 w-[calc(50%-0.5rem)] mr-2 mb-2">
            <Card>
              <CardContent className="flex justify-between items-center p-4">
                <div className="text-xl font-bold">
                  Total: ${calculateTotal().toFixed(2)}
                </div>
                <Button 
                  onClick={handleOpenPaymentModal}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Pagar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

       {/* Modal de Pago */}
       <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={paymentType} onValueChange={handlePaymentTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">Efectivo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card">Tarjeta</Label>
              </div>
            </RadioGroup>
            
            {paymentType === 'cash' && (
              <div>
                <Label htmlFor="amountPaid">Monto pagado:</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  value={amountPaid}
                  onChange={handleAmountPaidChange}
                  placeholder="Ingrese el monto pagado"
                  className="mt-4 mb-4"
                  ref={amountPaidInputRef}
                />
                <p className={`mt-2 font-bold ${getChangeTextColor()}`}>
                  {getChangeText()}
                </p>
              </div>
            )}
            <p className="font-bold">Total a pagar: ${calculateTotal().toFixed(2)}</p>
          </div>
          <DialogFooter>
            <Button onClick={handleClosePaymentModal} variant="outline" disabled={isLoading}>Cancelar</Button>
            <Button 
              onClick={handlePayment}
              disabled={paymentType === 'cash' && change < 0 || isLoading}
            >
              {isLoading ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;