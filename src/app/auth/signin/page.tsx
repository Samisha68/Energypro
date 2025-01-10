// app/auth/signin/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function SigninPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid credentials');
      }

      const data = await res.json();
      
      // Redirect based on user role
      if (data.user.role === 'BUYER') {
        router.push('/buyer-dashboard');
      } else {
        router.push('/seller-dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <span className="text-2xl font-bold text-white">EnergyPro</span>
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
            Welcome back
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Sign in to your account
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-300 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              className={`w-full py-3 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-300">
            Don&#39;t have an account?{' '}
            <Link href="/role-selection" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}