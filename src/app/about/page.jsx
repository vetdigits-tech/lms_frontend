'use client';

import Link from 'next/link';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 text-gray-900 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-800">About Us</h1>
      <div className="max-w-3xl text-center space-y-6">
        <p className="text-lg">
          <strong>VetDigit LMS</strong> is the first-ever dedicated online platform created exclusively for veterinary students — by veterinary students.
        </p>

        <p className="text-lg">
          We understand the real challenges, the complex subjects, and the high costs that often stand in the way of quality veterinary education.
          That’s why we built VetDigit — an affordable, accessible, and student-friendly solution that brings the best resources directly to you.
        </p>

        <p className="text-lg">
          Our courses are carefully designed and explained by those who have actually walked the same path — students who have successfully navigated the veterinary journey and know exactly what you need.
        </p>

        <p className="text-lg">
          Whether you’re preparing for your exams, exploring clinical knowledge, or seeking practical skills, VetDigit provides a trusted, simple, and affordable learning experience.
        </p>

        <p className="text-lg font-semibold text-blue-800">
          VetDigit LMS is not just a learning platform — it’s a student-powered revolution in veterinary education.
        </p>

        <Link href="/">
          <button className="mt-8 bg-blue-800 text-white px-6 py-3 rounded hover:scale-105 transition">
            Back to Home
          </button>
        </Link>
      </div>

      <footer className="mt-20 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} VetDigit LMS. All rights reserved.
      </footer>
    </div>
  );
}
