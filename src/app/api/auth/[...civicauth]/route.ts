import { handler } from "@civic/auth/nextjs";

// Initialize the handler with the client ID
const authHandler = handler();

export const GET = authHandler;
export const POST = authHandler; 