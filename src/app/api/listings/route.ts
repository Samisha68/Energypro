// src/app/api/listings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Validation schema
const ListingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  energyType: z.enum(['SOLAR', 'WIND', 'HYDRO', 'BIOMASS', 'GEOTHERMAL']),
  location: z.string().min(1, "Location is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  address: z.string().min(1, "Address is required"),
  totalCapacity: z.number().positive("Total capacity must be positive"),
  availableUnits: z.number().nonnegative("Available units cannot be negative"),
  minPurchase: z.number().positive("Minimum purchase must be positive"),
  maxPurchase: z.number().positive("Maximum purchase must be positive"),
  pricePerUnit: z.number().positive("Price per unit must be positive"),
  deliveryMethod: z.enum(['GRID', 'DIRECT', 'HYBRID']),
  sourceType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'UTILITY']),
  certification: z.string().optional().nullable(),
  discount: z.number().min(0).max(100).optional().nullable(),
  sellerWalletAddress: z.string().min(32, "Valid wallet address required").optional().nullable()
});

// Get current user from JWT
async function getCurrentUserId() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth-token')?.value;
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw new Error('Invalid token');
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    // Handle the case where 'current' is passed to get the current user's listings
    let actualSellerId = sellerId;
    
    if (sellerId === 'current') {
      try {
        actualSellerId = await getCurrentUserId();
      } catch (error) {
        console.error('Error getting current user ID:', error);
        return NextResponse.json(
          { success: false, error: 'Authentication required to view your listings' },
          { status: 401 }
        );
      }
    }

    const listings = await prisma.energyListing.findMany({
      where: actualSellerId ? { sellerId: actualSellerId } : {},
      include: {
        seller: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      data: listings 
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch listings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received listing creation request:', body);
    
    let userId;
    try {
      userId = await getCurrentUserId();
      console.log('User ID for listing creation:', userId);
    } catch (authError) {
      console.error('Authentication error during listing creation:', authError);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed',
        details: authError instanceof Error ? authError.message : 'Unknown authentication error'
      }, { status: 401 });
    }
    
    // Validate the input
    try {
      const validatedData = ListingSchema.parse(body);
      console.log('Validated listing data:', validatedData);
      
      // Create the listing
      const listing = await prisma.energyListing.create({
        data: {
          ...validatedData,
          sellerId: userId,
          totalCapacity: Number(validatedData.totalCapacity),
          availableUnits: Number(validatedData.availableUnits),
          minPurchase: Number(validatedData.minPurchase),
          maxPurchase: Number(validatedData.maxPurchase),
          pricePerUnit: Number(validatedData.pricePerUnit),
          discount: validatedData.discount ? Number(validatedData.discount) : null,
          sellerWalletAddress: validatedData.sellerWalletAddress,
          status: "ACTIVE",
          visibility: true,
          featured: false
        },
        include: {
          seller: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
      
      console.log('Listing created successfully:', listing.id);
      return NextResponse.json({ success: true, data: listing });
    } catch (validationError) {
      console.error('Validation error during listing creation:', validationError);
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed',
        details: validationError instanceof Error ? validationError.message : 'Unknown validation error'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Unexpected error during listing creation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create listing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('Received listing update request for ID:', body.id);
    
    let userId;
    try {
      userId = await getCurrentUserId();
      console.log('User ID for listing update:', userId);
    } catch (authError) {
      console.error('Authentication error during listing update:', authError);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed',
        details: authError instanceof Error ? authError.message : 'Unknown authentication error'
      }, { status: 401 });
    }
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Verify the listing exists and belongs to the user
    const existingListing = await prisma.energyListing.findUnique({
      where: { id: body.id }
    });

    if (!existingListing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (existingListing.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this listing' },
        { status: 403 }
      );
    }

    // Validate the input
    try {
      const validatedData = ListingSchema.parse(body);
      console.log('Validated update data for listing:', body.id);

      const listing = await prisma.energyListing.update({
        where: { id: body.id },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          energyType: validatedData.energyType,
          location: validatedData.location,
          state: validatedData.state,
          pincode: validatedData.pincode,
          address: validatedData.address,
          totalCapacity: Number(validatedData.totalCapacity),
          availableUnits: Number(validatedData.availableUnits),
          minPurchase: Number(validatedData.minPurchase),
          maxPurchase: Number(validatedData.maxPurchase),
          pricePerUnit: Number(validatedData.pricePerUnit),
          deliveryMethod: validatedData.deliveryMethod,
          sourceType: validatedData.sourceType,
          certification: validatedData.certification,
          discount: validatedData.discount ? Number(validatedData.discount) : null,
          sellerWalletAddress: validatedData.sellerWalletAddress
        },
        include: {
          seller: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      console.log('Listing updated successfully:', body.id);
      return NextResponse.json({ success: true, data: listing });
    } catch (validationError) {
      console.error('Validation error during listing update:', validationError);
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed',
        details: validationError instanceof Error ? validationError.message : 'Unknown validation error'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Unexpected error during listing update:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update listing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('Received listing deletion request for ID:', id);
    
    let userId;
    try {
      userId = await getCurrentUserId();
      console.log('User ID for listing deletion:', userId);
    } catch (authError) {
      console.error('Authentication error during listing deletion:', authError);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed',
        details: authError instanceof Error ? authError.message : 'Unknown authentication error'
      }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Verify the listing exists and belongs to the user
    const listing = await prisma.energyListing.findUnique({
      where: { id }
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.sellerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this listing' },
        { status: 403 }
      );
    }

    await prisma.energyListing.delete({
      where: { id }
    });

    console.log('Listing deleted successfully:', id);
    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error during listing deletion:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete listing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}