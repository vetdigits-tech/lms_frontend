'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(^|; )' + name + '=([^;]+)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

export default function LoginPageContent() {
  const router = useRouter();
  const { fetchUser, user, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const destination = user.role === 'admin' ? '/admin' : '/dashboard';
      router.replace(destination);
    }
  }, [loading, user, router]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`,
        { credentials: 'include' }
      );

      const xsrfToken = getCookie('XSRF-TOKEN');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
            'Accept': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }

      await fetchUser();
      toast.success('Logged in successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect`;
  };

  const handleResetPassword = () => {
    router.push('/reset-password');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10"></div>
      </div>
      
      {/* Larger mobile card with better positioning */}
      <div className="relative w-full max-w-sm sm:max-w-sm transform -translate-y-12 sm:translate-y-0">
        {/* Login Card - increased size */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20">
          
          {/* Header - increased padding */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 py-4 sm:px-6 sm:py-5 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative">
              <div className="mx-auto mb-2 w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-xl font-black sm:font-bold text-white mb-1">Welcome Back</h1>
              <p className="text-blue-100 text-xs hidden sm:block">Sign in to VetDigit</p>
            </div>
          </div>

          {/* Form - increased padding and spacing */}
          <div className="px-5 py-4 sm:px-6 sm:py-5">
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-center text-xs text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Email - increased padding */}
              <div>
                <label className="text-sm font-bold sm:font-medium text-gray-700 block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 sm:h-4 sm:w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-10 pr-3 py-3 sm:py-2.5 text-sm sm:text-sm text-gray-900 placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password - increased padding */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold sm:font-medium text-gray-700">Password</label>
                  {/* Show forgot button inline on mobile, separate on desktop */}
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm text-blue-600 hover:text-blue-700 font-bold sm:font-medium hover:underline transition-colors flex items-center space-x-1 sm:hidden"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Forgot?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 sm:h-4 sm:w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-10 pr-10 py-3 sm:py-2.5 text-sm sm:text-sm text-gray-900 placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password - show only on desktop */}
              <div className="hidden sm:flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors flex items-center space-x-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot?</span>
                </button>
              </div>

              {/* Sign In Button - increased padding */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 sm:py-3 text-sm sm:text-sm text-white font-bold sm:font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4" />
                    </>
                  )}
                </div>
              </button>

              {/* Divider - hide on mobile, show on desktop */}
              <div className="relative hidden sm:flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative bg-white px-2">
                  <span className="text-xs text-gray-400">or</span>
                </div>
              </div>

              {/* Google Button - increased padding */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full mt-2 sm:mt-0 rounded-lg border border-gray-200 bg-white py-3 sm:py-3 text-sm sm:text-sm text-gray-700 font-bold sm:font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4 sm:w-4 sm:h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="hidden sm:inline">Continue with Google</span>
                <span className="sm:hidden">Google</span>
              </button>
            </form>

            {/* Footer - increased margin */}
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-sm text-gray-600">
                <span className="hidden sm:inline">Don't have an account? </span>
                <Link href="/register" className="font-bold sm:font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  <span className="sm:hidden">Create account</span>
                  <span className="hidden sm:inline">Create one</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
