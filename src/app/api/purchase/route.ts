// app/api/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";

import connectDB from '@/app/lib/mongodb';

import Listing from "@/app/lib/models/Listing";
import Purchase from '@/app/models/Purchase';

// Hardcoded seller wallet address for all transactions
const SELLER_WALLET_ADDRESS = process.env.SELLER_WALLET_ADDRESS;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, quantity, buyerWalletAddress } = body;

    if (!listingId || !quantity || !buyerWalletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find the listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if enough units are available
    if (listing.availableUnits < quantity) {
      return NextResponse.json(
        { success: false, error: 'Not enough units available' },
        { status: 400 }
      );
    }

    // Reserve units (temporarily decrement available units)
    listing.availableUnits -= quantity;
    await listing.save();

    // Create a pending purchase record
    const purchase = new Purchase({
      listingId,
      listingName: listing.name,
      buyerWalletAddress,
      amount: quantity,
      pricePerUnit: listing.pricePerUnit,
      total: quantity * listing.pricePerUnit,
      transactionHash: 'pending',
      status: 'pending',
    });
    
    await purchase.save();

    return NextResponse.json({
      success: true,
      sellerWalletAddress: listing.sellerWalletAddress || SELLER_WALLET_ADDRESS,
      transaction: {
        listingId,
        amount: quantity,
        pricePerUnit: listing.pricePerUnit,
      },
      purchaseId: purchase._id.toString()
    });
  } catch (error: any) {
    console.error('Error processing purchase:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process purchase' },
      { status: 500 }
    );
  }
}

// Update purchase status with transaction hash
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { purchaseId, transactionHash, status } = body;

    if (!purchaseId || !transactionHash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find and update the purchase
    const purchase = await Purchase.findById(purchaseId);
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      );
    }

    purchase.transactionHash = transactionHash;
    purchase.status = status || 'completed';
    await purchase.save();

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update purchase' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve purchase history
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

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