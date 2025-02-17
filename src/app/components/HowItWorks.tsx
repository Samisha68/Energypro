'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    id: '01',
    name: 'Sign Up',
    description: 'Create your EnergyPro account quickly and start your journey.',
    icon: '🌟',
  },
  {
    id: '02',
    name: 'Connect Devices',
    description: 'Effortlessly link your smart energy devices for seamless tracking.',
    icon: '🔗',
  },
  {
    id: '03',
    name: 'Monitor Usage',
    description: 'Gain real-time insights into your energy consumption patterns.',
    icon: '📊',
  },
  {
    id: '04',
    name: 'Optimize',
    description: 'Get personalized tips and strategies to maximize energy efficiency.',
    icon: '⚡',
  },
]

export default function HowItWorks() {
  return (
    <div id="services" className="py-16 bg-gradient-to-r from-gray-800 via-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-lg text-blue-500 font-semibold tracking-wider uppercase"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="mt-4 text-4xl font-extrabold text-white sm:text-5xl"
          >
            Get started in four simple steps
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1 }}
            className="mt-6 max-w-3xl mx-auto text-lg text-gray-300"
          >
            EnergyPro helps you take charge of your energy consumption with ease and efficiency. Follow these steps to get started:
          </motion.p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative bg-gray-800 rounded-lg shadow-lg p-8"
            >
              <div className="flex items-center">
                <div className="h-16 w-16 flex items-center justify-center bg-blue-500 text-white rounded-full text-3xl font-bold">
                  {step.icon}
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-bold text-white">{step.name}</h3>
                  <p className="mt-2 text-gray-300">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
