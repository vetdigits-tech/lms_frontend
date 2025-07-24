'use client';
import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-blue-800">Terms & Conditions</h1>

      <p className="mb-2 text-sm text-gray-600">
        <strong>Effective Date:</strong> June 28, 2025
        <br />
        <strong>Last Updated:</strong> June 28, 2025
      </p>

      <p className="mb-6">
        Welcome to <strong>VetDigit</strong>, an online learning platform designed for
        veterinary students. By accessing or using VetDigit ("Platform", "Service"), you
        agree to the following terms and conditions ("Terms").
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">1. Acceptance of Terms</h2>
      <p>
        By registering, accessing, or using VetDigit, you agree to be bound by these
        Terms, including our Privacy Policy.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">2. Use of the Platform</h2>
      <ul className="list-disc ml-6 space-y-1 text-gray-800">
        <li>Enrolling in veterinary courses</li>
        <li>Watching educational content</li>
        <li>Participating in assessments and activities</li>
        <li>Not sharing login credentials or misusing the platform</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">3. User Accounts</h2>
      <p>
        Users must be at least 16 years old. You are responsible for safeguarding your
        login credentials. Accounts violating these Terms may be suspended.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">4. Course Access & Payment</h2>
      <p>
        Access to paid courses is non-transferable. We reserve the right to revoke access
        for any policy violations or misuse.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">5. Intellectual Property</h2>
      <p>
        All course content and platform materials are the property of VetDigit or its
        licensors. Unauthorized copying or redistribution is strictly prohibited.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">6. Third-Party Integrations</h2>
      <p>
        We may integrate with services like Google Drive and Cloudinary. Use of those
        services is subject to their respective terms and conditions.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">7. Disclaimer of Warranties</h2>
      <p>
        All platform content is provided “as is” with no guarantees or warranties. VetDigit
        is not responsible for outcomes based on the information provided.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">8. Limitation of Liability</h2>
      <p>
        We are not liable for indirect or consequential damages, technical issues, or
        interruptions to service beyond our control.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">9. Changes to Terms</h2>
      <p>
        We may revise these Terms at any time. Continued use of the platform implies
        acceptance of the latest version.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-700">10. Contact</h2>
      <p>
        Email: <a href="mailto:vetdigits@gmail.com" className="text-blue-600 underline">vetdigits@gmail.com</a>
        <br />
        Website: <a href="https://vetdigit.com" className="text-blue-600 underline">vetdigit.com</a>
      </p>
    </div>
  );
}
