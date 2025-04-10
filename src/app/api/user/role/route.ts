// app/api/user/role/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';
import User from '@/app/lib/models/User';

// Direct MongoDB connection without relying on connectDB function
const connectDirectly = async () => {
  try {
    // Skip if already connected
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    
    // Make sure MONGODB_URI is defined in your .env file
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Direct MongoDB connection established');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// GET handler to fetch user role
export async function GET() {
  try {
    // Connect directly to MongoDB
    await connectDirectly();
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    let user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      // If the user doesn't exist, create a default one
      console.log(`User not found in DB, creating with email: ${session.user.email}`);
      user = await User.create({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: 'buyer' // Default role
      });
    }

    return NextResponse.json({ role: user.role || 'buyer' });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Internal server error', role: 'buyer' }, // Return default role on error
      { status: 500 }
    );
  }
}

// POST handler to update user role
export async function POST(request: Request) {
  try {
    // Connect directly to MongoDB
    await connectDirectly();
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    
    if (!body.role || !['buyer', 'seller'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "buyer" or "seller"' },
        { status: 400 }
      );
    }

    // Update the user role
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { role: body.role },
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      role: updatedUser?.role || body.role
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}