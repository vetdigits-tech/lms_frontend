'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Instagram, Send } from 'lucide-react'; // Added Icons

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white px-6 py-12 text-gray-800 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-extrabold text-blue-800 mb-10 tracking-tight">
          About VetDigits
        </h1>

        <div className="bg-white p-10 md:p-14 rounded-2xl shadow-xl space-y-10 text-left border border-gray-200">
          {/* Main Content */}
          <section className="text-lg leading-relaxed space-y-6">
            <p>
              At VetDigits, our mission is rooted in a single principle:{' '}
              <span className="font-semibold text-blue-700">efforts matter more than results</span>.
              With the right intentions, guided by experts, we are transforming the landscape of veterinary education in India.
            </p>

            <p>
              Our vision is to build{' '}
              <span className="font-semibold text-green-700">
                India’s first veterinary study platform
              </span>{' '}
              that offers the most accurate and accessible learning material — tailored specifically
              for veterinary science students, by people who’ve walked that path.
            </p>
          </section>

          <blockquote className="mt-6 text-center italic text-gray-600 text-lg border-l-4 border-green-600 pl-4">
            “Efforts matter and not the results”
          </blockquote>

          <p className="mt-10 text-3xl font-extrabold text-green-700 text-center tracking-wide">
            JAI SHREE SHYAM 🚩
          </p>

          {/* Founders Section */}
          <section className="text-left mt-16">
            <h2 className="text-3xl font-semibold text-blue-700 mb-8 text-center">Meet the Founders</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Founder 1 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md text-center"
              >
                <h3 className="text-xl font-bold text-blue-700">
                  <Link
                    href="https://www.instagram.com/_lk.kaushik/"
                    target="_blank"
                    className="underline hover:text-blue-900"
                  >
                    Dr. Lakshay Kaushik
                  </Link>
                </h3>
                <p className="text-gray-600 mt-2 text-sm">Co-Founder</p>
                <p className="mt-3 text-sm text-gray-500">
                  Indian Veterinary Research Institute (ICAR-IVRI), Bareilly
                </p>
              </motion.div>

              {/* Founder 2 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md text-center"
              >
                <h3 className="text-xl font-bold text-gray-800">Dr. Akash Singh</h3>
                <p className="text-gray-600 mt-2 text-sm">Co-Founder</p>
                <p className="mt-3 text-sm text-gray-500">
                  Indian Veterinary Research Institute (ICAR-IVRI), Bareilly
                </p>
              </motion.div>

              {/* Founder 3 (Updated) */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-md text-center"
              >
                <h3 className="text-xl font-bold text-gray-800">Dr. Naresh Sharma</h3>
                <p className="text-gray-600 mt-2 text-sm">Co-Founder</p>
                <p className="mt-3 text-sm text-gray-500">
                  Indian Veterinary Research Institute (ICAR-IVRI), Bareilly
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <Link
                    href="https://www.instagram.com/vets_smile/"
                    target="_blank"
                    className="text-pink-600 hover:text-pink-800"
                  >
                    <Instagram size={22} />
                  </Link>
                  <Link
                    href="https://t.me/vetssmile"
                    target="_blank"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Send size={22} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
        </div>

        {/* Back to Home Button */}
        <Link href="/">
          <button className="mt-12 bg-blue-800 text-white px-10 py-3 rounded-xl text-lg font-semibold hover:bg-blue-900 hover:scale-105 transition duration-300 shadow-md">
            ← Back to Home
          </button>
        </Link>
      </div>

      <footer className="mt-24 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} VetDigits LMS. All rights reserved.
      </footer>
    </div>
  );
}
