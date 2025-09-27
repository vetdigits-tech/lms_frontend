// components/MaintenancePage.jsx
'use client'

import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');

  // Simple loading animation for the text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>Under Maintenance - LMS</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            We're Making Things Better
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Our learning platform is currently under maintenance. We're working hard to improve your experience and will be back soon.
          </p>
          
          {/* Animated status */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-blue-700 font-medium">
              Fixing security issues{dots}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Please wait a moment
            </p>
          </div>
          
          {/* Estimated time */}
          <div className="text-sm text-gray-500 mb-6">
            <p>Expected to be back in a few minutes</p>
          </div>
          
          {/* Contact info */}
          
        </div>
      </div>
    </>
  );
}
