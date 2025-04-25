import { NextResponse } from 'next/server';
import { getAllListings } from '@/app/lib/models/Listing';

export async function GET() {
  try {
    console.log('API /api/listings/all called');
    const listings = await getAllListings();
    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error in /api/listings/all:', error);
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 });
  }
} 