// app/auth/signup/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  name: string;
  role: 'BUYER' | 'SELLER';
  phone: string;
  address: string;
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  useEffect(() => {
    if (!role || !['BUYER', 'SELLER'].includes(role)) {
      router.push('/role-selection');
    }
  }, [role, router]);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    role: (role as 'BUYER' | 'SELLER') || 'BUYER',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'signup' | 'signin' | 'redirect'>('signup');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStep('signup');

    try {
      // First register the user
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!signupRes.ok) {
        const data = await signupRes.json();
        throw new Error(data.error || 'Registration failed');
      }

      setStep('signin');
      
      // After successful registration, automatically sign in
      const signinRes = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (!signinRes.ok) {
        throw new Error('Login failed. Please try signing in manually.');
      }

      setStep('redirect');
      
      // Redirect based on role
      if (formData.role === 'BUYER') {
        router.push('/buyer-dashboard');
      } else {
        router.push('/seller-dashboard');
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLoadingText = () => {
    switch (step) {
      case 'signup':
        return 'Creating account...';
      case 'signin':
        return 'Signing you in...';
      case 'redirect':
        return 'Redirecting to dashboard...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 w-full bg-black/60 backdrop-blur-md shadow-lg z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Bijlee</span>
          </Link>

          <Link href="/role-selection" className="group">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/40 transition-all duration-300">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Back</span>
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Create your account
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Register as a {role?.toLowerCase()}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-300 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-200">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-200">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center py-3 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {getLoadingText()}
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-300">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignUpContent />
    </Suspense>
  );
}