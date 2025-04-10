const mongoose = require('mongoose');
require('dotenv').config();

const HARDCODED_RECEIVER = '5PL4kXp3Ezz9uzn9jtLtjQfndKRNoQtgGPccM2kvvRad';

// Define Purchase Schema
const PurchaseSchema = new mongoose.Schema({
  listingId: {
    type: String,
    required: true,
  },
  buyer: {
    type: String,
    required: true,
  },
  paymentReceiver: {
    type: String,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  transactionSignature: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Register Purchase model
    const Purchase = mongoose.model('Purchase', PurchaseSchema);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Collections to keep
    const keepCollections = ['users', 'listings', 'purchases'];
    
    // Delete unwanted collections
    for (const collectionName of collectionNames) {
      if (!keepCollections.includes(collectionName)) {
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`Dropped collection: ${collectionName}`);
      }
    }

    // Verify purchases are linked to hardcoded receiver
    const result = await Purchase.updateMany(
      { paymentReceiver: { $ne: HARDCODED_RECEIVER } },
      { $set: { paymentReceiver: HARDCODED_RECEIVER } }
    );
    console.log(`Updated ${result.modifiedCount} purchases with correct receiver`);

    // Create indexes for better performance
    await mongoose.connection.db.collection('listings').createIndex({ seller: 1 });
    await mongoose.connection.db.collection('purchases').createIndex({ buyer: 1 });
    await mongoose.connection.db.collection('purchases').createIndex({ listingId: 1 });
    console.log('Created necessary indexes');

    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
}

cleanupDatabase(); 