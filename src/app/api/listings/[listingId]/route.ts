import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Listing from '@/app/lib/models/Listing';
import connectDB from '@/app/lib/mongodb';

// GET a specific listing by ID
export async function GET(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    // Ensure database connection
    await connectDB();
    
    const { listingId } = params;
    
    // Validate listingId
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }
    
    // Find the listing
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    console.error('Error details:', JSON.stringify(error, null, 2)); // More detailed error logging
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

// PUT to update a listing
export async function PUT(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    // Ensure database connection
    await connectDB();
    
    const { listingId } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    
    // Find the listing
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // Check if the user is the seller
    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not the seller of this listing' }, { status: 403 });
    }
    
    // Update the listing (only allow specific fields to be updated)
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      {
        name: body.name,
        location: body.location,
        pricePerUnit: body.pricePerUnit,
        maxUnitsAvailable: body.maxUnitsAvailable,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    console.error('Error updating listing:', error);
    console.error('Error details:', JSON.stringify(error, null, 2)); // More detailed error logging
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

// DELETE a listing
export async function DELETE(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    // Ensure database connection
    await connectDB();
    
    const { listingId } = params;
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the listing
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // Check if the user is the seller
    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not the seller of this listing' }, { status: 403 });
    }
    
    // Delete the listing
    await Listing.findByIdAndDelete(listingId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting listing:', error);
    console.error('Error details:', JSON.stringify(error, null, 2)); // More detailed error logging
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}