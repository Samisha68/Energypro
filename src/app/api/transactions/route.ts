import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');

    if (!sellerId) {
      return NextResponse.json({
        success: false,
        error: 'Seller ID is required'
      }, { status: 400 });
    }

    // Get all transactions for the seller's listings
    const transactions = await prisma.transaction.findMany({
      where: {
        listing: {
          sellerId: sellerId === 'current' ? undefined : sellerId
        },
        ...(status && { status: status as TransactionStatus })
      },
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