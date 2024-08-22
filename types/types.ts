// types.ts

export interface IStockLocation {
    location: string;
    quantity: number;
  }
  
  export interface Product {
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
  
  export interface CartItem extends Product {
    quantity: number;
    unitType: 'pieces' | 'boxes';
    appliedPrice: number;
  }