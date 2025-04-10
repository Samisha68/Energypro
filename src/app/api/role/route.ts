// /app/api/role/route.ts
// This endpoint will store the selected role in a cookie for use during the signup process
import {  NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import User from '@/app/lib/models/User';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    if (!role || !['buyer', 'seller'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user role
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { role },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, role: updatedUser.role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ role: null });
    }

    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}