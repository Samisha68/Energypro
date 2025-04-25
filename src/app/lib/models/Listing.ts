import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Ensure database connection before defining models
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/database')
  .catch(console.error);

// Define a schema
const listingSchema = new mongoose.Schema({
  sellerId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0,
  },
  maxUnitsAvailable: {
    type: Number,
    required: true,
    min: 1,
  },
  availableUnits: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if the model already exists before creating a new one
const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

export interface Listing {
  _id?: string;
  sellerId: string;
  name: string;
  location: string;
  pricePerUnit: number;
  maxUnitsAvailable: number;
  availableUnits: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function createListing(listing: Omit<Listing, '_id' | 'createdAt' | 'updatedAt'>) {
  await connectToDatabase();
  const newListing = {
    ...listing,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await Listing.create(newListing);
  return result.toObject();
}

export async function getListings(sellerId: string) {
  await connectToDatabase();
  const listings = await Listing.find({ sellerId }).sort({ createdAt: -1 }).lean();
  return listings.map((listing: any) => ({
    ...listing,
    _id: listing._id.toString()
  }));
}

export async function updateListing(id: string, updates: Partial<Listing>) {
  await connectToDatabase();
  const result = await Listing.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteListing(id: string) {
  await connectToDatabase();
  const result = await Listing.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export async function getAllListings() {
  await connectToDatabase();
  const listings = await Listing.find({}).sort({ createdAt: -1 }).lean();
  return listings.map((listing: any) => ({
    ...listing,
    _id: listing._id.toString()
  }));
}

export default Listing;