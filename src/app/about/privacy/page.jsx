'use client';
import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-blue-800">Privacy Policy</h1>

      <p className="mb-2 text-sm text-gray-600">
        <strong>Effective Date:</strong> June 28, 2025
        <br />
        <strong>Last Updated:</strong> June 28, 2025
      </p>

      <p className="mb-6">
        VetDigit ("we", "us", or "our") is committed to protecting your privacy. This
        Privacy Policy explains how we collect, use, and safeguard your data when
        using our veterinary learning platform.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">1. Information We Collect</h2>
      <ul className="list-disc ml-6 space-y-1 text-gray-800">
        <li>Personal Identification Information (Name, Email)</li>
        <li>Account Activity (Course enrollments, progress)</li>
        <li>Authentication Data (via Google OAuth)</li>
        <li>Device & Usage Info (IP address, browser)</li>
        <li>Uploaded Content</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">2. How We Use Your Information</h2>
      <ul className="list-disc ml-6 space-y-1 text-gray-800">
        <li>Provide and manage user accounts</li>
        <li>Deliver course content and track progress</li>
        <li>Personalize user experience</li>
        <li>Analyze usage to improve the platform</li>
        <li>Maintain platform security</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">3. Sharing Your Information</h2>
      <p className="text-gray-800">
        We only share information with trusted service providers like Google Drive
        and Cloudinary, or when legally required. We do not sell your data.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">4. Your Rights</h2>
      <p className="text-gray-800">
        You can request access, correction, or deletion of your data anytime by
        contacting us at <a href="mailto:vetdigits@gmail.com" className="text-blue-600 underline">vetdigits@gmail.com</a>.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">5. Changes to This Policy</h2>
      <p className="text-gray-800">
        This Privacy Policy may be updated occasionally. Changes will be posted on
        this page with a revised date.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">6. Contact Us</h2>
      <p className="text-gray-800">
        Email: <a href="mailto:vetdigits@gmail.com" className="text-blue-600 underline">vetdigits@gmail.com</a>
        <br />
        Website: <a href="https://vetdigit.com" className="text-blue-600 underline">vetdigit.com</a>
      </p>
    </div>
  );
}
