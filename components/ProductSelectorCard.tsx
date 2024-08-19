import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from 'next/image';

interface IProduct {
  _id: string;
  name: string;
  productCode: string;
  boxCode: string;
  imageUrl?: string;
  // Añade aquí otras propiedades que pueda tener tu objeto producto
}

interface ProductSelectorCardProps {
  product: IProduct;
  quantity: number;
  setQuantity: (quantity: number) => void;
  unitType: 'pieces' | 'boxes';
  setUnitType: (unitType: 'pieces' | 'boxes') => void;
  onAddToCart: () => void;
}

const ProductSelectorCard: React.FC<ProductSelectorCardProps> = ({ 
  product, 
  quantity, 
  setQuantity, 
  unitType, 
  setUnitType, 
  onAddToCart 
}) => {
  return (
    <Card className="w-full mb-4">
      <CardContent className="flex items-center p-4">
        {/* Imagen del producto */}
        <div className="w-1/4 mr-4">
          {product.imageUrl ? (
            <Image 
              src={product.imageUrl} 
              alt={product.name} 
              width={100} 
              height={100} 
              className="object-cover rounded"
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-gray-200 flex items-center justify-center rounded">
              No imagen
            </div>
          )}
        </div>
        
        {/* Información del producto */}
        <div className="w-2/4 mr-4">
          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600">Código: {product.productCode}</p>
          <p className="text-sm text-gray-600">Caja: {product.boxCode}</p>
        </div>
        
        {/* Selector de cantidad y tipo */}
        <div className="w-1/4 flex flex-col items-end">
          <div className="flex items-center mb-2">
            <Button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2 py-1"
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-16 mx-2 text-center"
            />
            <Button
              onClick={() => setQuantity(quantity + 1)}
              className="px-2 py-1"
            >
              +
            </Button>
          </div>
          
          <RadioGroup 
            value={unitType} 
            onValueChange={(value: 'pieces' | 'boxes') => setUnitType(value)}
            className="flex space-x-2"
          >
            <div className="flex items-center">
              <RadioGroupItem value="pieces" id="pieces" />
              <Label htmlFor="pieces" className="ml-1">Piezas</Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="boxes" id="boxes" />
              <Label htmlFor="boxes" className="ml-1">Cajas</Label>
            </div>
          </RadioGroup>
          
          <Button 
            onClick={onAddToCart}
            className="mt-2 w-full bg-primary text-primary-foreground"
          >
            Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSelectorCard;