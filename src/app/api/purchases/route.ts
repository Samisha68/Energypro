import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/app/lib/mongodb';
import Purchase from '@/app/models/Purchase';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectMongo();

    // Find purchases for this wallet
    const purchases = await Purchase.find({ buyerWalletAddress: walletAddress })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    return NextResponse.json({ success: true, purchases });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
} 