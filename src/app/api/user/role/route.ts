// app/api/user/role/route.ts
import { NextResponse } from 'next/server';
import { getUser } from "@civic/auth/nextjs";
import { connectToDatabase } from "@/lib/mongodb";

// GET handler to fetch user role
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

// POST handler to update user role
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await request.json();
    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection("users").updateOne(
      { userId: user.id },
      { $set: { role } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}