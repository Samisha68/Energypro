// app/auth/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession, SessionProvider } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Create a loading component for the Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      <p className="ml-3 text-gray-300">Loading...</p>
    </div>
  );
}

// Component that uses useSearchParams
function AuthContentWithParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [authType, setAuthType] = useState<'signin' | 'signup'>('signin');
  
  // If already authenticated, go to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      // Set role only for sign-up
      const params = authType === 'signup' ? { role: 'seller' } : {};
      
      // Use the callbackUrl from URL parameters if available
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      
      // Always use redirect mode to simplify flow
      await signIn("google", {
        callbackUrl,
        redirect: true,
        ...params
      });
    } catch (error) {
      // This should rarely execute due to redirect: true
      console.error("Authentication error:", error);
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        <p className="ml-3 text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full bg-black/60 backdrop-blur-md shadow-lg z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center transition-transform group-hover:rotate-[360deg] duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.636 9.148a.75.75 0 0 1-1.06-1.06l6.362-6.362a.75.75 0 0 1 1.06 0l6.362 6.362a.75.75 0 1 1-1.06 1.06L12 3.814 6.636 9.148Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
              EnergyPro
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 px-4 md:px-6">
        <div className="max-w-md mx-auto bg-gray-900/70 backdrop-blur-md p-8 rounded-lg shadow-lg border border-blue-500/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {authType === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400">
              {authType === 'signin' 
                ? 'Sign in to access your dashboard' 
                : 'Sign up to start selling energy'}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setAuthType('signin')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  authType === 'signin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthType('signup')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  authType === 'signup'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {authType === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main AuthContent component wrapper with SessionProvider
function AuthContent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthContentWithParams />
    </Suspense>
  );
}

export default function AuthPage() {
  return (
    <SessionProvider>
      <AuthContent />
    </SessionProvider>
  );
}