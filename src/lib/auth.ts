// src/lib/auth.ts
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword);
}

export function generateToken(payload: TokenPayload) {
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as TokenPayload;
  } catch (error) {
    console.log(error);
    throw new Error('Invalid token');
  }
}