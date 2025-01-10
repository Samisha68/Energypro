'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-gray-900 via-blue-900 to-black overflow-hidden h-screen pt-20">
      <div className="absolute inset-0 z-0">
        {/* Optional Background SVG */}
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

      <div className="max-w-7xl mx-auto relative z-10 h-full flex items-center justify-center">
        <main className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl tracking-tight font-extrabold text-white sm:text-6xl md:text-7xl"
          >
            <span className="block xl:inline">Welcome to</span>{' '}
            <span className="block text-blue-500 xl:inline">EnergyPro</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg text-gray-300 sm:mt-8 sm:text-xl sm:max-w-3xl sm:mx-auto md:mt-8 md:text-2xl lg:mx-0"
          >
            Revolutionizing energy management with cutting-edge technology and sustainable solutions.
          </motion.p>

          <div className="mt-10 sm:mt-12 sm:flex sm:justify-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="rounded-md shadow"
            >
              <a
                href="/role-selection"
                className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-300 focus:outline-none md:py-5 md:text-lg md:px-12"
              >
                Get Started
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-4 sm:mt-0 sm:ml-3"
            >
              <a
                href="#"
                className="w-full flex items-center justify-center px-8 py-4 border border-gray-700 text-base font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white focus:ring-4 focus:ring-gray-500 focus:outline-none md:py-5 md:text-lg md:px-12"
              >
                Learn More
              </a>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Why Choose EnergyPro Section */}
      <div className="px-4 sm:px-6 md:px-8 mt-20 sm:mt-32 lg:mt-40">
        <div className="text-center">
          <h2 className="text-3xl tracking-tight font-bold text-gray-100 sm:text-4xl md:text-5xl">
            Why Choose EnergyPro?
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-gray-300 sm:mt-6 sm:text-xl sm:mx-auto">
            EnergyPro empowers you to monitor, manage, and optimize energy consumption for a sustainable future.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white">Efficiency</h3>
            <p className="mt-2 text-gray-300">
              Advanced analytics for real-time energy optimization.
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-white">Sustainability</h3>
            <p className="mt-2 text-gray-300">
              Promote renewable energy and reduce carbon footprint.
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-white">Scalability</h3>
            <p className="mt-2 text-gray-300">
              Designed to grow with your energy needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
