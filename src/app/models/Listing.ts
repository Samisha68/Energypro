import mongoose, { Schema } from 'mongoose';

// Create Listing Schema
const listingSchema = new Schema({
  sellerId: {
    type: String,
    required: true,
  },
  sellerWalletAddress: {
    type: String,
    default: '5PL4kXp3Ezz9uzn9jtLtjQfndKRNoQtgGPccM2kvvRad',
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  maxUnitsAvailable: {
    type: Number,
    required: true,
  },
  availableUnits: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Export model or create if not exists
export default mongoose.models.Listing || mongoose.model('Listing', listingSchema); 