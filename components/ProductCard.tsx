import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  productCode: string;
  category: string;
  imageUrl?: string;
  availability: boolean;
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  onQuantityChange: (quantity: number) => void;
  onUnitTypeChange: (unitType: 'pieces' | 'boxes') => void;
  onAddToCart: () => void;
  isAvailable: boolean;
  maxQuantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  quantity, 
  unitType, 
  onQuantityChange, 
  onUnitTypeChange, 
  onAddToCart,
  isAvailable,
  maxQuantity 
}) => {
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const handleQuantityChange = (newQuantity: number) => {
    // Asegurarse de que la nueva cantidad no exceda maxQuantity
    const clampedQuantity = Math.min(Math.max(1, newQuantity), maxQuantity);
    onQuantityChange(clampedQuantity);
  };

  return (
    <Card className="mb-4">
      <CardContent className="flex items-stretch p-4 space-x-4">
        {/* Sección 1: Nombre del producto e Imagen */}
        <div className="w-1/3 flex flex-col items-center justify-center space-y-2">
          <h3 className="text-sm font-medium text-center">{product.name}</h3>
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

        <div className="w-1/12 flex items-center justify-center">
          <span className="text-5xl font-bold select-none transform rotate-45">+</span>
        </div>
        
        {/* Sección 2: Controles de cantidad y radio inputs */}
        <div className="w-2/5 flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-center space-x-2 pb-4">
            <Button 
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              size="sm"
              variant="outline"
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              onClick={handleInputClick}
              className="w-16 text-center no-spinners"
              aria-label="Cantidad"
            />
            <Button 
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxQuantity}
              size="sm"
              variant="outline"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <RadioGroup 
            value={unitType} 
            onValueChange={onUnitTypeChange} 
            className="flex justify-center space-x-4"
          >
            <div className="flex items-center">
              <RadioGroupItem value="pieces" id="pieces" />
              <Label htmlFor="pieces" className="ml-2">Piezas</Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="boxes" id="boxes" />
              <Label htmlFor="boxes" className="ml-2">Cajas</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Sección 3: Botón de agregar */}
        <div className="w-1/4 flex items-center justify-center">
          <Button 
            onClick={onAddToCart}
            className="w-full"
            disabled={!isAvailable || quantity === 0}
          >
            {isAvailable ? 'Agregar' : 'No disponible'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;