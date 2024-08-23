import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketItem extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  pricePerUnit: number;
  total: number;
}

export interface ITicket extends Document {
  ticketId: string;
  location: string;
  sequenceNumber: number;
  items: ITicketItem[];
  totalAmount: number;
  paymentType: 'cash' | 'card';
  amountPaid: number;
  change: number;
  date: Date;
}

const TicketItemSchema: Schema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitType: { type: String, enum: ['pieces', 'boxes'], required: true },
  pricePerUnit: { type: Number, required: true },
  total: { type: Number, required: true }
});

const TicketSchema: Schema = new Schema({
  ticketId: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  sequenceNumber: { type: Number, required: true },
  items: [TicketItemSchema],
  totalAmount: { type: Number, required: true },
  paymentType: { type: String, enum: ['cash', 'card'], required: true },
  amountPaid: { type: Number, required: true },
  change: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

// Índice compuesto para garantizar la unicidad de location + sequenceNumber
TicketSchema.index({ location: 1, sequenceNumber: 1 }, { unique: true });

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);