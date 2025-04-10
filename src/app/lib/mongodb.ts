import mongoose from 'mongoose';

// Cache the mongoose connection
let cachedConnection: typeof mongoose | null = null;

/**
 * Connect to MongoDB and cache the connection
 */
async function connectDB() {
  // Check if we have a cached connection
  if (cachedConnection) {
    console.log('Using existing mongoose connection');
    return cachedConnection;
  }

  // Get the MongoDB URI from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable'
    );
  }

  try {
    // Set mongoose connection options
    const opts = {
      bufferCommands: false,
    };

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI, opts);
    
    console.log('MongoDB connected successfully');
    
    // Cache the connection
    cachedConnection = conn;
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default connectDB;