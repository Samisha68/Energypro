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
  discount: z.number().min(0).max(100).optional().nullable()
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
  } catch {
    throw new Error('Invalid token');
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    const listings = await prisma.energyListing.findMany({
      where: sellerId ? { sellerId } : {},
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
    console.error('GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = await getCurrentUserId();
    
    // Validate the input
    const validatedData = ListingSchema.parse(body);

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

    return NextResponse.json({ success: true, data: listing });
  } catch (error) {
    console.error('POST Error:', error);
    
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Please sign in to create a listing'
      }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create listing'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const userId = await getCurrentUserId();
    
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

    const listing = await prisma.energyListing.update({
      where: { id: body.id },
      data: {
        title: body.title,
        description: body.description,
        energyType: body.energyType,
        location: body.location,
        state: body.state,
        pincode: body.pincode,
        address: body.address,
        totalCapacity: Number(body.totalCapacity),
        availableUnits: Number(body.availableUnits),
        minPurchase: Number(body.minPurchase),
        maxPurchase: Number(body.maxPurchase),
        pricePerUnit: Number(body.pricePerUnit),
        deliveryMethod: body.deliveryMethod,
        sourceType: body.sourceType,
        certification: body.certification,
        discount: body.discount ? Number(body.discount) : null
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

    return NextResponse.json({ success: true, data: listing });
  } catch (error) {
    console.error('PUT Error:', error);
    
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Please sign in to update listing'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update listing'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = await getCurrentUserId();

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

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('DELETE Error:', error);
    
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Please sign in to delete listing'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete listing'
    }, { status: 500 });
  }
}