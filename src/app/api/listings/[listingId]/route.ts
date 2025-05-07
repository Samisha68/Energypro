import { NextResponse } from 'next/server';
import { getUser } from '@civic/auth/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET a specific listing by ID
export async function GET(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(params.listingId),
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT to update a listing
export async function PUT(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();
    
    const result = await db.collection('listings').updateOne(
      { _id: new ObjectId(params.listingId), userId: user.id },
      { $set: { ...body, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Listing updated successfully' });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a listing
export async function DELETE(
  request: Request,
  { params }: { params: { listingId: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('listings').deleteOne({
      _id: new ObjectId(params.listingId),
      userId: user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}