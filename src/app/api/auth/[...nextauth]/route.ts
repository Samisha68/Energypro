// /app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { DefaultSession } from "next-auth";
import { clientPromise } from "@/lib/mongodb";
import type { NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

// Export the NextAuth options so they can be imported elsewhere
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Add this line to fix the account linking issue
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = "buyer"; // Default role
        
        // Fix the TypeScript error by adding an explicit check for account
        if (account && account.provider === "google") {
          const signupRole = (account as any)?.role;
          if (signupRole) {
            token.role = signupRole;
          }
        }
      }
      return token;
    },
    
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback called with:", { url, baseUrl });
      
      // If there's an error, redirect to dashboard instead of showing errors
      if (url.includes('error=')) {
        console.log(`Auth error detected, but redirecting to dashboard: ${url}`);
        return `${baseUrl}/dashboard`;
      }
      
      // Force redirect to dashboard after successful auth
      if (url.includes('/api/auth/callback') || url.includes('/api/auth/signin')) {
        console.log("Auth callback detected, redirecting to dashboard");
        return `${baseUrl}/dashboard`;
      }
      
      // If the URL is relative, make it absolute
      if (url.startsWith('/')) {
        console.log("Converting relative URL to absolute:", url);
        return `${baseUrl}${url}`;
      }
      
      // If the URL is already absolute and starts with the base URL, use it
      if (url.startsWith(baseUrl)) {
        console.log("Using absolute URL that starts with base URL:", url);
        return url;
      }
      
      // Default to dashboard
      console.log("Using default redirect to dashboard");
      return `${baseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  events: {
    async createUser({ user }) {
      console.log('New user created:', { email: user.email });
    },
    async linkAccount({ user, account}) {
      console.log('Account linked successfully:', { email: user.email, provider: account.provider });
    },
    async signIn({ user, account}) {
      console.log('Sign in successful:', { email: user.email, provider: account?.provider || 'unknown' });
    },
    async signOut({ }) {
      console.log('Sign out successful');
    }
  },
  // Enable debug mode to see more logs in development
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error(`Auth error (${code}):`, metadata);
    },
    warn(code) {
      console.warn(`Auth warning (${code})`);
    },
    debug(code, metadata) {
      console.log(`Auth debug (${code}):`, metadata);
    },
  },
};

// Create the handler using the exported options
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };