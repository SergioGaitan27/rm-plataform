"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import ProductInfo from '@/components/ProductInfo';
import ConectorPluginV3 from '@/app/utils/ConectorPluginV3';

interface IBusinessInfo {
  businessName: string;
  address: string;
  phone: string;
  taxId: string;
}

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
  const [pluginConnected, setPluginConnected] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<IBusinessInfo | null>(null);
  const [isCorteModalOpen, setIsCorteModalOpen] = useState(false);
  const [cashAmountCorte, setCashAmountCorte] = useState('');
  const [cardAmountCorte, setCardAmountCorte] = useState('');

  const fetchBusinessInfo = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      const response = await fetch(`/api/business?location=${encodeURIComponent(userLocation)}`);
      if (!response.ok) {
        throw new Error('Error al obtener la información del negocio');
      }
      const data = await response.json();
      setBusinessInfo(data);
    } catch (error) {
      console.error('Error al obtener la información del negocio:', error);
    }
  }, [userLocation]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserLocation();
      fetchProducts();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, session]);

  useEffect(() => {
    fetchBusinessInfo();
  }, [fetchBusinessInfo]);

  useEffect(() => {
    // El plugin siempre estará disponible ahora que es un módulo TypeScript
    setPluginConnected(true);
  }, []);

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
    if (searchTermTop.trim().toUpperCase() === 'CORTE') {
      setIsCorteModalOpen(true);
      setSearchTermTop('');
      return;
    }
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

  const getAvailableQuantity = (product: Product): number => {
    const locationStock = product.stockLocations.find(location => location.location === userLocation);
    return locationStock ? locationStock.quantity : 0;
  };

  const getRemainingQuantity = (product: Product): number => {
    const availableQuantity = getAvailableQuantity(product);
    const cartQuantity = cart
      .filter(item => item._id === product._id)
      .reduce((total, item) => total + (item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity), 0);
    return availableQuantity - cartQuantity;
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      const remainingQuantity = getRemainingQuantity(selectedProduct);
      const quantityToAdd = unitType === 'boxes' ? quantity * selectedProduct.piecesPerBox : quantity;
  
      if (quantityToAdd > remainingQuantity) {
        toast.error(`No hay suficiente inventario. Cantidad disponible: ${remainingQuantity} piezas.`);
        return;
      }
  
      const updatedCart = [...cart];
      
      // Encontrar todos los items del mismo producto en el carrito
      const existingItems = updatedCart.filter(item => item._id === selectedProduct._id);
      
      // Calcular la cantidad total de este producto en el carrito
      const totalQuantityInCart = existingItems.reduce((total, item) => 
        total + (item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity), 0);
  
      // Añadir la nueva cantidad
      const newTotalQuantity = totalQuantityInCart + quantityToAdd;
  
      // Calcular el nuevo precio basado en la cantidad total
      const newAppliedPrice = calculatePrice(selectedProduct, newTotalQuantity);
  
      const existingItemIndex = updatedCart.findIndex(
        item => item._id === selectedProduct._id && item.unitType === unitType
      );
  
      if (existingItemIndex !== -1) {
        // Actualizar item existente
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity,
          appliedPrice: newAppliedPrice
        };
      } else {
        // Añadir nuevo item
        updatedCart.push({
          ...selectedProduct,
          quantity,
          unitType,
          appliedPrice: newAppliedPrice
        });
      }
  
      // Actualizar precios para todos los items del mismo producto
      updatedCart.forEach(item => {
        if (item._id === selectedProduct._id) {
          item.appliedPrice = newAppliedPrice;
        }
      });
  
      setCart(updatedCart);
      setSelectedProduct(null);
      setQuantity(1);
      setUnitType('pieces');
      toast.success('Producto añadido al carrito');
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (selectedProduct) {
      const remainingQuantity = getRemainingQuantity(selectedProduct);
      const maxQuantity = unitType === 'boxes' 
        ? Math.floor(remainingQuantity / selectedProduct.piecesPerBox)
        : remainingQuantity;
  
      if (newQuantity > maxQuantity) {
        toast.error(`La cantidad máxima disponible es ${maxQuantity} ${unitType === 'boxes' ? 'cajas' : 'piezas'}.`);
        setQuantity(maxQuantity);
      } else {
        setQuantity(newQuantity);
      }
    } else {
      setQuantity(newQuantity);
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

  const [printerConfig, setPrinterConfig] = useState<{ printerName: string; paperSize: string }>({
    printerName: '',
    paperSize: '80mm',
  });

  useEffect(() => {
    // Cargar la configuración de la impresora
    const savedConfig = localStorage.getItem('printerConfig');
    if (savedConfig) {
      setPrinterConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Modificar la función printTicket para usar la configuración
  const printTicket = async (ticketId?: string) => {
    if (!pluginConnected) {
      toast.error('El plugin de impresión no está conectado');
      return;
    }
  
    try {
      const conector = new ConectorPluginV3(undefined, 'YmEwNzRiYWFfXzIwMjQtMDctMTBfXzIwMjQtMTAtMDgjIyMxUXJaS2xpWjVjbU01VEVmckg5Zm93RWxWOHVmQmhYNjVFQnE1akVFMzBZWG51QUs5YUd0U3Ayc2d0N2E0a1ZiOExEMm1EV2NnTjJhTWR0dDhObUw2bFBLTERGYjBXYkFpTTBBNjJTYlo5KzBLRUVLMzlFeEVLcVR5d2dEcWdsQzUvWlhxZCtxUC9aQ1RnL2M5UVhKRUxJRXVYOGVRU0dxZlg4UFF1MkFiY3doME5mdUdYaitHVk1LMzRvcmRDN0FEeTg4ZStURmlQRktrRW9UcnBMSisrYkJQTC8wZ1ZZdFIxdTNGV3dYQWR0Ylg3U25paU5qZ0I5QmNTQlZRRmp5NWRGYUVyODFnak1UR2VPWHB6T2xMZUhWWmJFVUJCQkhEOENyUGJ4NlNQYXBxOHA1NVlCNS9IZkJ0VWpsSDdMa1JocGlBSWF6Z2hVdzRPMFZ6aVZ6enpVbHNnR091VElWdTdaODRvUDlvWjg5bGI5djIxbTcwSDB4L1ZqSXlGNU52b2JTemoyNXMzL3NxS2I1SEtYVHduVW5tTXBvcWxGZmwwajZXM1ZFQnhkdjh2Y2VRMWtaSWkyY1ZWbjNUK29tTkJLWFRkR0NQSS9UaWgyaWNWdFlQZ05IbENxUXBBK0c3ZHFBUTd4VEh6TEJuT2dMemU2THZuRkpRajBpZkt0dlNHNDNzVU82bmRUaS8zbHpta1orK2lIWmVZR3pIampKWnV5RFRRbEo2MUpOamVYUWpHMTliREFaNFZ3SDhJanBWOEUyRERBLzVDcEYwL1l5MTByTTdlT0t0K1JaTWFlc3pHbkRpeXoydHpRK0Z4ZjNrdFV3U1ZFbCtCcFQ2Y1NLSzVNaFFjWDJjMmlrcWpCbVZSNDBzSVhKMjV1VXB1Nko0L1liMzgzNE1iWT0=');
  
      await conector.Iniciar();
  
      // Ajustar el ancho de impresión según el tamaño del papel
      let anchoCaracteres;
      switch (printerConfig.paperSize) {
        case '58mm':
          anchoCaracteres = 32;
          break;
        case '80mm':
          anchoCaracteres = 48;
          break;
        case 'A4':
          anchoCaracteres = 64;
          break;
        default:
          anchoCaracteres = 48; // valor por defecto
          console.warn(`Tamaño de papel desconocido: ${printerConfig.paperSize}. Usando ancho por defecto.`);
      }

      // Imprimir información del negocio
      if (businessInfo) {
        conector.EstablecerEnfatizado(true);
        conector.EstablecerTamañoFuente(1, 1);
        conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_IZQUIERDA);
        conector.EscribirTexto(`${businessInfo.businessName}\n`);
        conector.EstablecerEnfatizado(false);
        conector.EscribirTexto(`${businessInfo.address}\n`);
        conector.EscribirTexto(`Tel: ${businessInfo.phone}\n`);
        conector.EscribirTexto(`RFC: ${businessInfo.taxId}\n`);
        conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
      }

        // Añadir fecha y hora

        conector.EstablecerEnfatizado(true);
        conector.EstablecerTamañoFuente(1, 1);
        conector.EscribirTexto(`Fecha: ${new Date().toLocaleString()}\n`);
        if (ticketId) {
          conector.EscribirTexto(`ID: ${ticketId}\n`);
        }
        conector.EstablecerEnfatizado(false);
        
        conector.EscribirTexto("=".repeat(anchoCaracteres) + "\n");
        cart.forEach(item => {
          const totalPieces = item.unitType === 'boxes' ? item.quantity * item.piecesPerBox : item.quantity;
          conector.EscribirTexto(`${item.name}\n`);
          conector.EscribirTexto(`${totalPieces} x $${item.appliedPrice.toFixed(2)} = $${(totalPieces * item.appliedPrice).toFixed(2)}\n`);
        });
    
      conector.EscribirTexto("\n");
      conector.EscribirTexto(`Total: $${calculateTotal().toFixed(2)}\n`);
      conector.EscribirTexto(`Método de pago: ${paymentType === 'cash' ? 'Efectivo' : 'Tarjeta'}\n`);
      if (paymentType === 'cash') {
        conector.EscribirTexto(`Monto pagado: $${amountPaid}\n`);
        conector.EscribirTexto(`Cambio: $${change.toFixed(2)}\n`);
      }

      conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
      const qrUrl = `https://www.rmazh.com.mx/consultarTicketID?id=${ticketId}`;
      conector.ImprimirCodigoQr(qrUrl, anchoCaracteres * 8, ConectorPluginV3.RECUPERACION_QR_MEJOR, ConectorPluginV3.TAMAÑO_IMAGEN_NORMAL);
    
    // Centrar el texto debajo del QR
    conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_CENTRO);
    conector.EscribirTexto("\nEscanea el código QR para más detalles\n");
    conector.EstablecerAlineacion(ConectorPluginV3.ALINEACION_IZQUIERDA);

    conector.Corte(0);
      
      const resultado = await conector.imprimirEn(printerConfig.printerName);

      if (typeof resultado === 'object' && resultado !== null && 'error' in resultado) {
        throw new Error(resultado.error);
      } else if (resultado !== true) {
        throw new Error('La impresión no se completó correctamente');
      }
  
      toast.success('Ticket impreso correctamente');
    } catch (error) {
      console.error('Error al imprimir:', error);
      if (error instanceof Error) {
        toast.error(`Error al imprimir el ticket: ${error.message}`);
      } else {
        toast.error('Error desconocido al imprimir el ticket');
      }
    }
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

  const isProductAvailable = (product: Product): boolean => {
    return product.availability && getRemainingQuantity(product) > 0;
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
    change,
    location: userLocation // Asegúrate de que userLocation esté definido y sea correcto
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

    // Imprimir el ticket con el ticketId si está disponible
    await printTicket(data.ticket?.ticketId);
  
      // Limpiar el carrito y cerrar el modal de pago
      handleClosePaymentModal();
      setCart([]);
      
      // Mostrar mensaje de éxito
      toast.success('Pago procesado e impreso exitosamente');
  
      // Limpiar la información del producto seleccionado
      setProductInfoBottom(null);
      setSearchTermBottom('');
    } catch (error) {
      console.error('Error al procesar el pago o imprimir:', error);
      toast.error('Error al procesar el pago o imprimir el ticket');
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
            <div className={`border-2 ${isProductAvailable(selectedProduct) ? 'border-green-500' : 'border-red-500'} rounded-lg p-4 mb-4`}>
              <ProductCard
                product={selectedProduct}
                quantity={quantity}
                unitType={unitType}
                onQuantityChange={handleQuantityChange}
                onUnitTypeChange={(value: 'pieces' | 'boxes') => {
                  setUnitType(value);
                  setQuantity(1); // Reset quantity when changing unit type
                }}
                onAddToCart={handleAddToCart}
                isAvailable={getRemainingQuantity(selectedProduct) > 0}
                maxQuantity={unitType === 'boxes' 
                  ? Math.floor(getRemainingQuantity(selectedProduct) / selectedProduct.piecesPerBox)
                  : getRemainingQuantity(selectedProduct)}
              />
            </div>
          )}
          </CardContent>
        </Card>
       
        <Card className="flex-grow overflow-hidden flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Información de productos</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <ProductInfo
              searchTermBottom={searchTermBottom}
              handleSearchBottomChange={handleSearchBottomChange}
              handleKeyPressBottom={handleKeyPressBottom}
              handleSearchBottom={handleSearchBottom}
              filteredProducts={filteredProducts}
              handleSelectProduct={handleSelectProduct}
              productInfoBottom={productInfoBottom}
              getRemainingQuantity={getRemainingQuantity}
              isProductAvailable={isProductAvailable}
              handleAddFromDetails={handleAddFromDetails}
              productSearchedFromBottom={productSearchedFromBottom}
              calculateStockDisplay={calculateStockDisplay}
            />
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
      {/* Modal de Corte */}
      <Dialog open={isCorteModalOpen} onOpenChange={setIsCorteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Realizar Corte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cashAmountCorte">Monto en Efectivo:</Label>
              <Input
                id="cashAmountCorte"
                type="number"
                value={cashAmountCorte}
                onChange={(e) => setCashAmountCorte(e.target.value)}
                placeholder="Ingrese el monto en efectivo"
                className="mt-2 mb-4"
              />
            </div>
            <div>
              <Label htmlFor="cardAmountCorte">Monto en Tarjeta:</Label>
              <Input
                id="cardAmountCorte"
                type="number"
                value={cardAmountCorte}
                onChange={(e) => setCardAmountCorte(e.target.value)}
                placeholder="Ingrese el monto en tarjeta"
                className="mt-2 mb-4"
              />
            </div>
            <p className="font-bold">Total: ${(+cashAmountCorte + +cardAmountCorte).toFixed(2)}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCorteModalOpen(false)} variant="outline">Cancelar</Button>
            <Button
              onClick={() => {
                // Aquí puedes manejar la lógica adicional para el corte
                setIsCorteModalOpen(false);
                toast.success('Corte realizado exitosamente');
              }}
            >
              Confirmar Corte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;