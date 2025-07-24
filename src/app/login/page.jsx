'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
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

  // Redirect when user is authenticated and not loading
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

    try {
      // 1) Bootstrap CSRF cookie
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`,
        { credentials: 'include' }
      );

      // 2) Get XSRF token from cookie
      const xsrfToken = getCookie('XSRF-TOKEN');

      // 3) Attempt login
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

      // 4) Refresh auth context (sets user)
      await fetchUser();

      toast.success('Logged in successfully!');
      // Redirect handled in useEffect above
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Google Sign-In click
  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/redirect`;
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 px-4">
      <div className="w-full max-w-xs sm:max-w-sm transform -translate-y-12 rounded-xl bg-white/80 p-6 sm:p-8 shadow-xl backdrop-blur-lg">
        <h2 className="mb-4 text-center text-2xl sm:text-3xl font-bold text-blue-600">
          VetDigit <span className="text-indigo-600">Login</span>
        </h2>

        {error && (
          <p className="mb-3 text-center text-sm text-red-600">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 bg-white px-8 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 bg-white px-8 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm text-white font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Login
          </button>

          {/* Google Sign In Button styled same as Login */}
          <button
            type="button"
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm text-white font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={handleGoogleSignIn}
          >
            Sign in with Google
          </button>
        </form>

        <p className="mt-5 text-center text-xs sm:text-sm text-gray-700">
          Don’t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
