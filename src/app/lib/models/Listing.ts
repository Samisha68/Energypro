import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Ensure database connection before defining models
connectToDatabase().catch(console.error);

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
  const { db } = await connectToDatabase();
  
  const newListing = {
    ...listing,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection("listings").insertOne(newListing);
  return { ...newListing, _id: result.insertedId.toString() };
}

export async function getListings(sellerEmail: string) {
  const { db } = await connectToDatabase();
  
  const listings = await db.collection("listings")
    .find({ sellerEmail })
    .sort({ createdAt: -1 })
    .toArray();

  return listings.map(listing => ({
    ...listing,
    _id: listing._id.toString()
  }));
}

export async function updateListing(id: string, updates: Partial<Listing>) {
  const { db } = await connectToDatabase();
  
  const result = await db.collection("listings").updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        ...updates,
        updatedAt: new Date()
      } 
    }
  );

  return result.modifiedCount > 0;
}

export async function deleteListing(id: string) {
  const { db } = await connectToDatabase();
  
  const result = await db.collection("listings").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

export default Listing;