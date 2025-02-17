'use client'

import { motion } from 'framer-motion'
import { Zap, BarChart, Shield } from 'lucide-react'


const features = [
  {
    name: 'Real-time Monitoring',
    description: 'Track your energy consumption in real-time with our advanced monitoring system.',
    icon: Zap,
  },
  {
    name: 'Data Analytics',
    description: 'Gain valuable insights with our powerful data analytics and visualization tools.',
    icon: BarChart,
  },
  {
    name: 'Secure Platform',
    description: 'Rest easy knowing your data is protected by our state-of-the-art security measures.',
    icon: Shield,
  },
]

export default function Features() {
  return (
    <div id="about" className="py-16 bg-gradient-to-r from-gray-800 via-gray-900 to-black">
      
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-lg text-blue-500 font-semibold tracking-wide uppercase"
          >
            Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="mt-4 text-3xl font-extrabold text-white sm:text-4xl"
          >
            A better way to manage energy
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1 }}
            className="mt-6 max-w-3xl mx-auto text-lg text-gray-300"
          >
            EnergyPro provides cutting-edge tools to help you optimize your energy consumption and reduce costs.
          </motion.p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative bg-gray-800 rounded-lg shadow-lg p-8 hover:bg-gray-700 transition duration-300"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-blue-500 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="ml-4 text-lg font-bold text-white">{feature.name}</h3>
              </div>
              <p className="mt-4 text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
