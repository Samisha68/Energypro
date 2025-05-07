// /app/api/role/route.ts
// This endpoint will store the selected role in a cookie for use during the signup process
import {  NextResponse } from 'next/server';
import { getUser } from "@civic/auth/nextjs";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await getUser();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    if (!role || !['buyer', 'seller'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user role
    const { db } = await connectToDatabase();
    const updatedUser = await db.collection("users").findOneAndUpdate(
      { userId: session.user.id },
      { $set: { role } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, role: updatedUser.value?.role });
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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const userRole = await db.collection("users").findOne(
      { userId: user.id },
      { projection: { role: 1 } }
    );

    return NextResponse.json({ role: userRole?.role || "user" });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}