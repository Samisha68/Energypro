const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    console.log(collections.map(c => c.name));

    // Check users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\nUsers:', users.length);
    if (users.length > 0) {
      console.log('Sample user:', {
        name: users[0].name,
        email: users[0].email,
        role: users[0].role
      });
    }

    // Check listings
    const listings = await mongoose.connection.db.collection('listings').find({}).toArray();
    console.log('\nListings:', listings.length);
    if (listings.length > 0) {
      console.log('Sample listing:', {
        seller: listings[0].seller,
        name: listings[0].name,
        pricePerUnit: listings[0].pricePerUnit,
        availableUnits: listings[0].availableUnits
      });
    }

    // Check purchases
    const purchases = await mongoose.connection.db.collection('purchases').find({}).toArray();
    console.log('\nPurchases:', purchases.length);
    if (purchases.length > 0) {
      console.log('Sample purchase:', {
        buyer: purchases[0].buyer,
        listingId: purchases[0].listingId,
        units: purchases[0].units,
        totalAmount: purchases[0].totalAmount,
        status: purchases[0].status
      });
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkDatabase(); 