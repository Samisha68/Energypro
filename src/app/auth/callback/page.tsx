"use client";

import { useUser } from "@civic/auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!isLoading) {
        try {
          if (user) {
            // Get the callback URL from the search params or default to dashboard
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
            // Add a small delay to ensure the session is properly set
            await new Promise(resolve => setTimeout(resolve, 500));
            router.replace(callbackUrl);
          } else {
            router.replace('/auth');
          }
        } catch (error) {
          console.error('Redirect error:', error);
          router.replace('/auth');
        }
      }
    };

    handleRedirect();
  }, [user, isLoading, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
} 