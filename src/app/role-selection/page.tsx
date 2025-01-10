'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShoppingCart, Zap, TrendingUp, Clock, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function RoleSelection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'SELLER' | null>(null);

  const handleRoleSelection = (role: 'BUYER' | 'SELLER') => {
    setSelectedRole(role);
  };

  const handleAuthChoice = (isNewUser: boolean) => {
    if (selectedRole) {
      if (isNewUser) {
        router.push(`/auth/signup?role=${selectedRole}`);
      } else {
        router.push('/auth/signin');
      }
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-black via-gray-900 to-blue-900 overflow-hidden min-h-screen">
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

          <Link href="/" className="group">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/40 focus:ring-2 focus:ring-blue-300 transition-all duration-300 group-hover:text-white">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Back</span>
            </button>
          </Link>
        </div>
      </nav>

      {/* Background Animation */}
      <div className="absolute inset-0 z-0">
        <div className="animate-pulse opacity-30">
          <svg
            className="absolute top-20 left-40 w-96 h-96"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 600 600"
          >
            <circle cx="300" cy="300" r="300" fill="url(#grad1)" />
            <defs>
              <radialGradient
                id="grad1"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="scale(300)"
              >
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {!selectedRole ? (
          <>
            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-6xl font-extrabold text-white sm:text-7xl mb-4 drop-shadow-lg"
            >
              Who Are You?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-xl text-gray-300 sm:text-2xl max-w-xl mx-auto mb-12"
            >
              Choose your role and start your journey with Bijlee.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl">
              {/* Buyer Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelection('BUYER')}
                className="group relative bg-gradient-to-t from-blue-900 via-blue-800 to-blue-700 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 border border-blue-600/50"
              >
                <div className="p-8 text-center relative z-10">
                  <div className="bg-blue-600/50 w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-blue-100 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">I&#39;m a Buyer</h3>
                  <div className="space-y-3 text-left mb-6">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-blue-300" />
                      <span className="text-gray-200 text-sm">Access to Energy Resources</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-blue-300" />
                      <span className="text-gray-200 text-sm">Real-time Market Insights</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-blue-300" />
                      <span className="text-gray-200 text-sm">Instant Procurement</span>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-500 opacity-0 rounded-2xl blur-lg group-hover:opacity-20 transition-opacity"></div>
              </motion.div>

              {/* Seller Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelection('SELLER')}
                className="group relative bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700 hover:from-gray-700 hover:via-gray-600 hover:to-gray-500 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 border border-gray-600/50"
              >
                <div className="p-8 text-center relative z-10">
                  <div className="bg-gray-600/30 w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center">
                    <UserPlus className="w-12 h-12 text-gray-300 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">I&#39;m a Seller</h3>
                  <div className="space-y-3 text-left mb-6">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 text-sm">Sell Energy Efficiently</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 text-sm">Access to Buyers</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 text-sm">Revenue Insights</span>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gray-500 opacity-0 rounded-2xl blur-lg group-hover:opacity-20 transition-opacity"></div>
              </motion.div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <motion.h2 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold text-white mb-6"
            >
              {selectedRole === 'BUYER' ? 'Welcome Buyer!' : 'Welcome Seller!'}
            </motion.h2>
            <motion.p className="text-gray-300 mb-8">
              Do you already have an account with us?
            </motion.p>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAuthChoice(true)}
                className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                I&#39;m New Here
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAuthChoice(false)}
                className="w-full p-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                I Have an Account
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(null)}
                className="w-full p-4 bg-transparent border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Go Back
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}