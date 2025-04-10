import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from '@/app/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use the same connectDB function as other routes
    await connectDB();
    
    // Access the db through the mongoose connection
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error("Database connection not established");
    }
    
    // Find all sales for the current seller
    const sales = await db.collection("sales").find({
      sellerEmail: session.user.email
    }).toArray();

    return NextResponse.json({ sales });
  } catch (error) {
    console.error("Error fetching sales:", error);
    console.error('Error details:', JSON.stringify(error, null, 2)); // More detailed error logging
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}