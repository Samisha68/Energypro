import { NextResponse } from "next/server";
import { getUser } from "@civic/auth/nextjs";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const sales = await db.collection("sales").find({ userId: user.id }).toArray();
    
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await connectToDatabase();
    
    const result = await db.collection("sales").insertOne({
      ...body,
      userId: user.id,
      createdAt: new Date(),
    });
    
    return NextResponse.json({ id: result.insertedId });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}