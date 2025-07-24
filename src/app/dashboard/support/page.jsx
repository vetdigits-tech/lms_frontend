'use client';

import { useState } from 'react';
import Link from 'next/link';

const FAQ = [
  {
    q: 'How do I reset my password?',
    a: 'Go to the Login page, click “Forgot Password”, enter your email and follow the link we email you.',
  },
  {
    q: 'Can I download videos?',
    a: 'For copyright reasons we stream only. However, you can watch on any device with your account.',
  },
  {
    q: 'How do I enroll in a course?',
    a: 'To enroll in a course, first make sure you are logged in with your Gmail account—the same one you want to use to access the course materials. Navigate to the "Courses" section from the sidebar, select your desired course, and click "View Details". Then, choose "Buy Now", complete your payment, and you will be enrolled instantly.',
  },
  {
    q: 'How much time does it take for my enrolled courses to appear?',
    a: 'Enrolled courses appear instantly after your payment is successfully completed.',
  },
  {
    q: 'Why are the videos not loading?',
    a: 'Videos will only load if you are logged into your system with the same Gmail account you used for registration. Alternatively, use the "Sign in with Google" option on the login page to ensure proper access.',
  },
  {
    q: 'How long will I have access to the course materials?',
    a: 'You will have access to the course materials until the course is completed. Typically, this duration is 1 year from the date of enrollment.',
  },
  {
    q: 'Will there be any live lectures?',
    a: 'No, all lectures are pre-recorded and available to watch at your convenience.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'No, we do not offer any refunds once a purchase has been made.',
  },
];

export default function SupportPage() {
  const [open, setOpen] = useState(null);

  return (
    <div className="pt-2 pr-6 pl-4 text-gray-900 w-full">
      <h1 className="text-3xl font-bold text-blue-700 mb-8">Support</h1>

      {/* FAQ Section */}
      <section className="rounded-lg border bg-white shadow-sm mb-12">
        <div className="rounded-t-lg bg-blue-50 px-6 py-3 font-semibold text-blue-800">FAQs</div>

        <ul className="divide-y">
          {FAQ.map((item, idx) => (
            <li key={idx} className="px-6 py-4">
              <button
                onClick={() => setOpen((o) => (o === idx ? null : idx))}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-sm sm:text-base font-medium">{item.q}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform ${open === idx ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === idx && (
                <p className="mt-3 text-sm leading-relaxed text-gray-800">{item.a}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Contact Section */}
      <section className="rounded-lg border bg-white shadow-sm">
        <div className="rounded-t-lg bg-blue-50 px-6 py-3 font-semibold text-blue-800">Contact&nbsp;Us</div>
        <div className="space-y-4 px-6 py-6">
          <p>
            Still need help? Reach out to us — we typically respond within 24 hours.
          </p>

          <div className="flex items-center gap-4">
            <span className="rounded-full bg-blue-100 p-3 text-blue-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 17.25V6.75M21.75 6.75A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25M21.75 6.75l-9.75 6.75L2.25 6.75"
                />
              </svg>
            </span>
            <a
              href="mailto:vetdigits@gmail.com"
              className="text-lg font-semibold text-blue-700 underline hover:text-blue-900"
            >
              vetdigits@gmail.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}