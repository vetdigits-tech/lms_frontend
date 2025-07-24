'use client';

import Link from 'next/link';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-8 text-gray-800 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-blue-800 tracking-tight">
          About Our Mission
        </h1>

        <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg space-y-6 text-left">
          <p className="text-lg leading-relaxed">
            Our platform was created from a shared{' '}
            <strong className="text-blue-700">vision, dedication, teamwork, and a deep passion</strong>{' '}
            for veterinary science. It shows what can be accomplished when people work together for a common goal.
          </p>

          <p className="text-lg leading-relaxed">
            We worked closely with{' '}
            <strong className="text-blue-700">experienced professionals</strong> to build every part of our platform. Our commitment is to{' '}
            <strong className="text-blue-700">improve animal healthcare</strong>. We offer a complete learning experience shaped by experts in the field.
          </p>

          <p className="text-lg leading-relaxed">
            We know that the path to becoming a veterinary professional is{' '}
            <strong className="text-blue-700">long, very difficult, and takes up a lot of time</strong>. It's a tough road. But we believe that with the right{' '}
            <strong className="text-blue-700">tools, a clear goal, and persistence</strong>, this challenge can become a rewarding journey. Together, we are{' '}
            <strong className="text-blue-700">building the future of veterinary care</strong>.
          </p>

          <p className="mt-8 text-2xl font-bold text-green-700 text-center">
            JAI SHREE SHYAM 🚩
          </p>
        </div>

        <Link href="/">
          <button className="mt-12 bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 hover:scale-105 transition-transform duration-300 ease-in-out shadow-md">
            Back to Home
          </button>
        </Link>
      </div>

      <footer className="mt-24 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} VetDigit LMS. All rights reserved.
      </footer>
    </div>
  );
}
