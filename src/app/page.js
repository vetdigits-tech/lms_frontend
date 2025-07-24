// File: src/app/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-700 to-purple-700 text-white">
      <svg
        className="animate-spin h-8 w-8 mr-2 text-white"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      <span className="text-lg font-semibold">Loading…</span>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showContact, setShowContact] = useState(false);

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
  const currentPath = window.location.pathname;

  if (!loading && user && currentPath === '/') {
    const target = user.role === 'admin' ? '/admin' : '/dashboard';
    router.push(target);
  }
}, [user, loading, router]);


  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="relative flex flex-col items-center justify-between min-h-screen bg-gradient-to-br from-blue-700 to-purple-700 px-4 py-16 text-white">
      {/* Contact Us toggle */}
      <button
        onClick={() => setShowContact((v) => !v)}
        className="absolute top-4 right-4 rounded-full border border-white/80 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur hover:bg-white hover:text-blue-800 transition"
      >
        {showContact ? 'Close' : 'Contact Us'}
      </button>

      {/* Contact panel */}
      {showContact && (
        <div className="absolute top-16 right-4 w-64 rounded-lg bg-white/90 p-4 text-center text-sm font-semibold text-blue-800 shadow-lg backdrop-blur-sm">
          <p className="mb-1 uppercase text-xs tracking-wide text-gray-600">Email</p>
          <a
            href="mailto:vetdigits@gmail.com"
            className="break-words text-blue-700 underline hover:text-blue-900"
          >
            vetdigits@gmail.com
          </a>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center text-center space-y-6 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-snug">
          Welcome to VetDigit LMS
        </h1>
        <p className="max-w-lg text-lg text-white/90">
          Learn, grow, and upskill with our premium digital learning platform.
        </p>

        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Link href="/login">
            <button className="w-full bg-white text-blue-800 font-semibold px-4 py-3 rounded-lg hover:scale-105 transition">
              Continue to LMS
            </button>
          </Link>
          <Link href="/register">
            <button className="w-full bg-yellow-400 text-blue-800 font-semibold px-4 py-3 rounded-lg hover:scale-105 transition">
              Register Now
            </button>
          </Link>
          <Link href="/about">
            <button className="w-full border border-white text-white font-semibold px-4 py-3 rounded-lg hover:scale-105 transition">
              About Us
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-screen-lg mt-10 text-center text-xs sm:text-sm text-white/80">
        <div className="space-y-2">
          <div>© {new Date().getFullYear()} VetDigit LMS. All rights reserved.</div>
          <div className="flex justify-center space-x-4">
            <Link href="/about/terms" className="underline hover:text-yellow-300">
              Terms & Conditions
            </Link>
            <Link href="/about/privacy" className="underline hover:text-yellow-300">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-auto mt-4 h-px w-24 bg-white/30" />

        {/* Powered By Aqua Vitoe */}
        <div className="mt-2 text-xs sm:text-sm text-white/70">
          POWERED BY{' '}
          <Link href="https://www.aquavitoelab.com/" className="underline hover:text-yellow-300">
            AQUA VITOE
          </Link>
        </div>
      </footer>
    </main>
  );
}
