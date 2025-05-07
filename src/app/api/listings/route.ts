import { NextResponse } from 'next/server';
import { getUser } from '@civic/auth/nextjs';
import { connectToDatabase } from '@/lib/mongodb';

// POST: Create a new listing
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { db } = await connectToDatabase();
    const result = await db.collection('listings').insertOne({
      ...body,
      userId: user.id,
      createdAt: new Date(),
    });
    return NextResponse.json({ id: result.insertedId });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Fetch all listings for the current user
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { db } = await connectToDatabase();
    const listings = await db.collection('listings').find({}).toArray();
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}