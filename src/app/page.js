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

  const fullText = 'Welcome to VetDigit';
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

  useEffect(() => {
    if (!loading && user && window.location.pathname === '/') {
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
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
        <div className="absolute top-16 right-4 w-72 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Modern Header with Subtle Gradient */}
          <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 px-5 py-3 border-b border-gray-100/80">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
            <h3 className="relative text-sm font-semibold text-gray-800 text-center tracking-tight">
              Let's Connect
            </h3>
          </div>

          {/* Modern Content with Cards */}
          <div className="p-5 space-y-4 bg-gradient-to-b from-white/50 to-gray-50/30">

            {/* Email Card */}
            <div className="group relative bg-white/60 hover:bg-white/80 rounded-xl p-4 border border-gray-100/50 hover:border-blue-200/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</p>
                  <a
                    href="mailto:vetdigits@gmail.com"
                    className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors duration-200 block truncate group-hover:text-blue-600"
                  >
                    vetdigits@gmail.com
                  </a>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Telegram Card */}
            <div className="group relative bg-white/60 hover:bg-white/80 rounded-xl p-4 border border-gray-100/50 hover:border-blue-200/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
                    <img
                      src="https://res.cloudinary.com/deqwz7nib/image/upload/v1756563268/jtdekluqvt6t9vqlbnfm.png"
                      alt="Telegram"
                      className="w-6 h-6 object-cover"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Telegram</p>
                  <a
                    href="https://t.me/vetssmile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors duration-200 group-hover:text-blue-600"
                  >
                    @vetssmile
                  </a>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Footer with Status */}
          <div className="px-5 py-3 bg-gradient-to-r from-gray-50/80 to-slate-50/80 border-t border-gray-100/60">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">Available now</span>
            </div>
          </div>
        </div>
      )}




      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center text-center space-y-6 px-4">
        <h1 className="text-3xl font-extrabold leading-tight whitespace-nowrap sm:text-4xl md:text-6xl">
          <span className="inline-block border-r-4 border-white animate-caret">
            {typedText}
          </span>
        </h1>
        <p className={`max-w-lg text-lg text-white/90 transition-opacity duration-700 ${completed ? 'opacity-100' : 'opacity-0'}`}>
          Learn, grow, and upskill with our premium digital learning platform.
        </p>

        <div className={`flex w-full max-w-md flex-col gap-4 transition-opacity duration-700 sm:flex-row ${completed ? 'opacity-100' : 'opacity-0'}`}>
          <Link href="/login">
            <button className="w-full bg-white text-blue-800 font-semibold px-4 py-3 rounded-full sm:rounded-lg hover:scale-105 transition">
              Continue to LMS
            </button>
          </Link>
          <Link href="/register">
            <button className="w-full bg-yellow-400 text-blue-800 font-semibold px-4 py-3 rounded-full sm:rounded-lg hover:scale-105 transition">
              Register Now
            </button>
          </Link>
          <Link href="/about">
            <button className="w-full border border-white text-white font-semibold px-4 py-3 rounded-full sm:rounded-lg hover:scale-105 transition">
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
