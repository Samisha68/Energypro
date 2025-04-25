import mongoose, { Schema } from 'mongoose';

// Create Purchase Schema
const purchaseSchema = new Schema({
  listingId: {
    type: String,
    required: true,
  },
  listingName: {
    type: String,
    required: true,
  },
  buyerWalletAddress: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  transactionHash: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Export model or create if not exists
export default mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema); 