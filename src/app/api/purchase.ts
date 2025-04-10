// app/api/purchases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]/route";

import Listing from "@/app/lib/models/Listing";

// Hardcoded seller wallet address for all transactions
const SELLER_WALLET_ADDRESS = "5PL4kXp3Ezz9uzn9jtLtjQfndKRNoQtgGPccM2kvvRad";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if session exists and if the user has a role property
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await req.json();
    const { listingId, quantity, buyerWalletAddress } = body;
    
    // Validate input
    if (!listingId || !quantity || !buyerWalletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Connect to the database - use the connectDB function properly

    
    // Find the listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    // Check availability
    if (listing.availableUnits < quantity) {
      return NextResponse.json({ error: 'Not enough units available' }, { status: 400 });
    }
    
    // Update listing availability
    listing.availableUnits -= quantity;
    await listing.save();
    
    // Return transaction details for the frontend to use with the Solana smart contract
    return NextResponse.json({
      success: true,
      sellerWalletAddress: SELLER_WALLET_ADDRESS,
      transaction: {
        buyerAddress: buyerWalletAddress,
        amount: quantity,
        pricePerUnit: listing.pricePerUnit,
        totalPrice: quantity * listing.pricePerUnit,
        listingId: listing._id.toString()
      }
    });
  } catch (error) {
    console.error("Error processing purchase:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve purchase history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return an empty array since we don't have a Purchase model yet
    // In a real implementation, you would query the database for the user's purchases
    return NextResponse.json({ purchases: [] });
    
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase history' },
      { status: 500 }
    );
  }
}