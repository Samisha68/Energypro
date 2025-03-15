// app/api/auth/signin/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    console.log('Starting signin process...');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', { email: body.email, hasPassword: !!body.password });

    if (!body.email || !body.password) {
      console.log('Missing credentials');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Find user with error handling for database issues
    console.log('Looking up user:', email);
    let user;
    try {
      user =await prisma.user.findUnique({
        where: { email }
      });
    } catch (dbError) {
      console.error('Database error when finding user:', dbError);
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error code:', dbError.code);
        return NextResponse.json(
          { error: 'Database error', code: dbError.code },
          { status: 500 }
        );
      }
      throw dbError;
    }

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User found, verifying password...');
    // Verify password
    try {
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    } catch (passwordError) {
      console.error('Error verifying password:', passwordError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    console.log('Password verified, generating token...');
    // Generate JWT token
    let token;
    try {
      token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    } catch (tokenError) {
      console.error('Error generating token:', tokenError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    console.log('Token generated, creating response...');
    // Create response with the token in the body
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });

    console.log('Setting cookie...');
    // Set token in HTTP-only cookie
    try {
      // Set the cookie in the response headers
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });
    } catch (cookieError) {
      console.error('Error setting cookie:', cookieError);
      // Continue anyway, as the token is still in the response body
    }

    console.log('Signin successful');
    return response;

  } catch (error) {
    console.error('Signin error:', error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error({
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}