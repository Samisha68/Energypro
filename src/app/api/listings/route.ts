import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';

// Export a POST method handler for creating listings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Add the seller's ID to the listing
    const listing = {
      ...body,
      sellerId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("listings").insertOne(listing);
    
    return NextResponse.json({
      message: 'Listing created successfully',
      listing: { ...listing, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ 
      error: 'Failed to create listing' 
    }, { status: 500 });
  }
}

// Export a GET method handler for fetching all listings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Find all listings for the current user
    const listings = await db.collection("listings").find({
      sellerId: session.user.id
    }).toArray();

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch listings' 
    }, { status: 500 });
  }
}