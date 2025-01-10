// src/app/api/purchase/route.ts
import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { z } from 'zod';
import { TransactionStatus } from '@prisma/client';

const PurchaseSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  buyerPublicKey: z.string().min(1, "Buyer wallet address is required"),
  quantity: z.number().positive("Quantity must be positive"),
  totalAmount: z.number().positive("Total amount must be positive")
});

export async function POST(request: Request) {
  try {
    // Parse and log the request data
    const body = await request.json();
    console.log('Received purchase request:', JSON.stringify(body, null, 2));

    // Validate request data
    const validatedData = PurchaseSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    // Find the listing
    const listing = await prisma.energyListing.findUnique({
      where: { id: validatedData.listingId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Found listing:', JSON.stringify(listing, null, 2));

    if (!listing) {
      console.log('Listing not found for ID:', validatedData.listingId);
      return NextResponse.json({
        success: false,
        error: 'Listing not found'
      }, { status: 404 });
    }

    // Validate quantity and availability
    if (validatedData.quantity > listing.availableUnits) {
      return NextResponse.json({
        success: false,
        error: 'Not enough units available'
      }, { status: 400 });
    }

    if (validatedData.quantity < listing.minPurchase || 
        validatedData.quantity > listing.maxPurchase) {
      return NextResponse.json({
        success: false,
        error: `Quantity must be between ${listing.minPurchase} and ${listing.maxPurchase} units`
      }, { status: 400 });
    }

    // Calculate final price
    const subtotal = listing.pricePerUnit * validatedData.quantity;

    // Verify total amount matches (allowing for small floating-point differences)
    if (Math.abs(subtotal - validatedData.totalAmount) > 0.01) {
      return NextResponse.json({
        success: false,
        error: 'Price calculation mismatch'
      }, { status: 400 });
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        listingId: listing.id,
        buyerId: listing.seller.id, // This should be replaced with actual buyer's ID when auth is implemented
        
        units: validatedData.quantity,
        pricePerUnit: listing.pricePerUnit,
        totalPrice: validatedData.totalAmount,
        status: TransactionStatus.PENDING
      }
    });

    console.log('Created transaction:', JSON.stringify(transaction, null, 2));

    // Update the listing's available units
    const updatedListing = await prisma.energyListing.update({
      where: { id: listing.id },
      data: {
        availableUnits: {
          decrement: validatedData.quantity
        },
        // Update status to SOLD_OUT if no more units available
        ...(listing.availableUnits - validatedData.quantity <= 0 && {
          status: 'SOLD_OUT'
        })
      }
    });

    console.log('Updated listing:', JSON.stringify(updatedListing, null, 2));

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        units: validatedData.quantity,
        totalAmount: validatedData.totalAmount,
        status: transaction.status
      }
    });

  } catch (error: any) {
    console.error('Purchase error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process purchase',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerPublicKey = searchParams.get('buyerPublicKey');

    if (!buyerPublicKey) {
      return NextResponse.json({
        success: false,
        error: 'Buyer public key is required'
      }, { status: 400 });
    }

    // Get all transactions for the buyer
    const transactions = await prisma.transaction.findMany({
      where: {  },
      include: {
        listing: {
          select: {
            title: true,
            energyType: true,
            location: true,
            state: true,
            seller: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transactions'
    }, { status: 500 });
  }
}