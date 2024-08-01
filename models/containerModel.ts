// models/containerModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct {
  name: string;
  code: string;
  boxes: number;
}

export interface IContainer extends Document {
  containerNumber: string;
  products: IProduct[];
  status: 'preloaded' | 'received' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ContainerSchema: Schema = new Schema({
  containerNumber: { type: String, required: true, unique: true },
  products: [{
    name: { type: String, required: true },
    code: { type: String, required: true },
    boxes: { type: Number, required: true }
  }],
  status: { type: String, enum: ['preloaded', 'received', 'completed'], default: 'preloaded' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Container || mongoose.model<IContainer>('Container', ContainerSchema);