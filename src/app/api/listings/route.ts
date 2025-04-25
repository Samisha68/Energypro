import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import Listing from '@/app/models/Listing';
import connectDB from '@/app/lib/mongodb';

// POST: Create a new listing
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    await connectDB();
    const listing = await Listing.create({
      ...body,
      sellerId: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return NextResponse.json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ 
      error: 'Failed to create listing' 
    }, { status: 500 });
  }
}

// GET: Fetch all listings for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const listings = await Listing.find({ sellerId: session.user.email }).sort({ createdAt: -1 });
    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch listings' 
    }, { status: 500 });
  }
}