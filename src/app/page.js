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

  // Typing animation state
  const fullText = 'Welcome to VetDigit LMS';
  const [typedText, setTypedText] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, idx + 1));
      idx += 1;
      if (idx === fullText.length) {
        clearInterval(interval);
        setCompleted(true);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (!loading && user && currentPath === '/') {
      const target = user.role === 'admin' ? '/admin' : '/dashboard';
      router.push(target);
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;

  return (
    <main className="relative flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-700 to-purple-700 px-4 py-16 text-white">
      {/* Contact toggle */}
      <button
        onClick={() => setShowContact(v => !v)}
        className="absolute top-4 right-4 rounded-full border border-white/80 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur hover:bg-white hover:text-blue-800 transition"
      >
        {showContact ? 'Close' : 'Contact Us'}
      </button>
      {showContact && (
        <div className="absolute top-16 right-4 w-64 rounded-lg bg-white/90 p-4 text-center text-sm font-semibold text-blue-800 shadow-lg backdrop-blur-sm">
          <p className="uppercase text-xs tracking-wide text-gray-600">Email</p>
          <a href="mailto:vetdigits@gmail.com" className="break-words text-blue-700 underline hover:text-blue-900">
            vetdigits@gmail.com
          </a>
        </div>
      )}

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center text-center space-y-6 px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight whitespace-nowrap">
          <span className="inline-block border-r-4 border-white animate-caret">
            {typedText}
          </span>
        </h1>
        <p className={`max-w-lg text-lg text-white/90 transition-opacity duration-700 ${completed ? 'opacity-100' : 'opacity-0'}`}>
          Learn, grow, and upskill with our premium digital learning platform.
        </p>

        <div className={`flex w-full max-w-md flex-col gap-3 sm:flex-row transition-opacity duration-700 ${completed ? 'opacity-100' : 'opacity-0'}`}>
          <Link href="/login">
            <button className="w-full bg-white text-blue-800 font-semibold px-4 py-3 rounded-lg transform hover:scale-105 transition">
              Continue to LMS
            </button>
          </Link>
          <Link href="/register">
            <button className="w-full bg-yellow-400 text-blue-800 font-semibold px-4 py-3 rounded-lg transform hover:scale-105 transition">
              Register Now
            </button>
          </Link>
          <Link href="/about">
            <button className="w-full border border-white text-white font-semibold px-4 py-3 rounded-lg transform hover:scale-105 transition">
              About Us
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-screen-lg mt-10 md:mt-auto text-center text-xs sm:text-sm text-white/80">
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
        <div className="mx-auto mt-2 h-px w-24 bg-white/30" />
        <div className="mt-2 text-xs sm:text-sm text-white/70">
          POWERED BY{' '}
          <Link href="https://www.aquavitoelab.com/" className="underline hover:text-yellow-300">
            AQUA VITOE
          </Link>
        </div>
      </footer>

      <style jsx>{`
        @keyframes caret {
          0%, 100% { border-color: transparent; }
          50% { border-color: white; }
        }
        .animate-caret {
          animation: caret 0.8s steps(1) infinite;
        }
      `}</style>
    </main>
  );
}
