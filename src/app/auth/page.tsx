// app/auth/page.tsx
"use client";

import { UserButton } from "@civic/auth/react";
import { useUser } from "@civic/auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft } from 'react-icons/fa';

export default function AuthPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-blue-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-blue-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0">
        <svg
          className="absolute left-0 top-0 h-full w-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 800 800"
          fill="none"
        >
          <circle cx="400" cy="400" r="400" fill="url(#gradient)" />
          <defs>
            <radialGradient
              id="gradient"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="rotate(45) scale(400)"
            >
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#000000" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-700/50 relative z-10"
      >
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-center text-3xl font-extrabold text-white"
          >
            Welcome to{" "}
            <span className="text-blue-500">EnergyPro</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-2 text-center text-sm text-gray-300"
          >
            Sign in to access your energy marketplace
          </motion.p>
        </div>
        <div className="mt-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-full max-w-sm flex justify-center">
              <UserButton />
            </div>
            <p className="text-sm text-gray-400 text-center">
              Secure authentication powered by Civic
            </p>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900/50 text-gray-400">
                Protected by Civic Auth
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
      >
        <FaArrowLeft />
        <span>Back to Home</span>
      </motion.button>
    </div>
  );
}