// app/models/Product.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IStockLocation {
  location: string;
  quantity: number;
}

export interface IProduct extends Document {
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
  category: string; // Nuevo campo
  availability: boolean; // Nuevo campo
}

const ProductSchema: Schema = new Schema({
  boxCode: { type: String, required: true, unique: true },
  productCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  piecesPerBox: { type: Number, required: true },
  cost: { type: Number, required: true },
  price1: { type: Number, required: true },
  price1MinQty: { type: Number, required: true },
  price2: { type: Number, required: true },
  price2MinQty: { type: Number, required: true },
  price3: { type: Number, required: true },
  price3MinQty: { type: Number, required: true },
  price4: { type: Number },
  price5: { type: Number },
  stockLocations: [{
    location: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  imageUrl: { type: String },
  category: { type: String, default: 'Sin categoría' }, // Nuevo campo
  availability: { type: Boolean, default: true } // Nuevo campo
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);