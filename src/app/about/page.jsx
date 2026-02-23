'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Instagram, Send, Target, BookOpen, GraduationCap } from 'lucide-react';

const founders = [
  {
    name: 'Dr. Lakshay Kaushik',
    role: 'Co-Founder',
    institute: 'ICAR-IVRI, Bareilly',
    initials: 'LK',
    instagram: 'https://www.instagram.com/_lk.kaushik/',
    telegram: null,
    specialisation: null,
  },
  {
    name: 'Dr. Akash Singh',
    role: 'Co-Founder',
    institute: 'ICAR-IVRI, Bareilly',
    initials: 'AS',
    instagram: null,
    telegram: null,
    specialisation: null,
  },
  {
    name: 'Dr. Naresh Sharma',
    role: 'Co-Founder',
    institute: 'ICAR-IVRI, Bareilly',
    initials: 'NS',
    instagram: 'https://www.instagram.com/vets_smile/',
    telegram: 'https://t.me/vetssmile',
    specialisation: null,
  },
  {
    name: 'Dr. Anchal Sharma',
    role: 'Co-Founder',
    institute: 'ICAR-IVRI, Bareilly',
    initials: 'AS',
    instagram: 'https://www.instagram.com/sharmaanchalgarg',
    telegram: null,
    specialisation: 'IVRI Medicine · ICAR PG AIR 18',
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">

      {/* ── Hero ── */}
      <div className="bg-[#0f2044] text-white py-24 px-6 text-center relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Soft glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 border border-white/20 text-white/60 text-xs font-semibold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6">
            <GraduationCap size={13} />
            Veterinary Education · India
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-5 text-white">
            About VetDigits
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            India's dedicated veterinary learning platform — built by veterinarians, for veterinarians.
          </p>
        </motion.div>
      </div>

      {/* ── Thin accent bar ── */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">

        {/* ── Mission & Vision ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center flex-shrink-0">
                <Target size={18} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-[#0f2044] uppercase tracking-wider">Our Mission</h2>
            </div>
            <p className="text-gray-500 leading-relaxed text-sm">
              Rooted in the belief that{' '}
              <span className="font-semibold text-[#0f2044]">efforts matter more than results</span>,
              we guide aspiring veterinary professionals with expert-curated content
              and a community that truly understands the journey.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={18} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-[#0f2044] uppercase tracking-wider">Our Vision</h2>
            </div>
            <p className="text-gray-500 leading-relaxed text-sm">
              To build{' '}
              <span className="font-semibold text-[#0f2044]">
                India's first dedicated veterinary study platform
              </span>{' '}
              — the most accurate and accessible learning material, made by people
              who've walked the same path.
            </p>
          </div>
        </motion.div>

        {/* ── Divider with quote ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="max-w-2xl mx-auto">
            <p className="text-2xl md:text-3xl font-light italic text-slate-600 leading-relaxed">
              &ldquo;Efforts matter and not the results&rdquo;
            </p>
            <p className="mt-6 text-xl font-bold text-[#0f2044] tracking-wide">
              JAI SHREE SHYAM 🚩
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        </motion.div>

        {/* ── Founders ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500 mb-3">
              The People Behind VetDigits
            </p>
            <h2 className="text-4xl font-extrabold text-[#0f2044]">Meet the Founders</h2>
            <p className="text-slate-400 mt-3 text-sm max-w-md mx-auto">
              Veterinary professionals who built the platform they wished they had as students.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {founders.map((founder, i) => (
              <motion.div
                key={founder.name}
                whileHover={{ y: -4 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Top accent line — single blue, same for all */}
                <div className="h-1 w-full bg-[#1d4ed8]" />

                <div className="p-6 flex flex-col items-center text-center flex-1">
                  {/* Initials avatar — uniform dark navy */}
                  <div className="w-14 h-14 rounded-xl bg-[#0f2044] flex items-center justify-center shadow-md mb-4">
                    <span className="text-white font-bold text-lg tracking-wide">{founder.initials}</span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0f2044] leading-snug">{founder.name}</h3>
                  <p className="text-xs text-blue-500 font-semibold mt-1 uppercase tracking-widest">{founder.role}</p>

                  {/* Specialisation — only shown if present */}
                  {founder.specialisation && (
                    <p className="mt-2 text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg leading-snug">
                      {founder.specialisation}
                    </p>
                  )}

                  <p className="mt-3 text-[11px] text-slate-400 leading-relaxed flex-1">{founder.institute}</p>

                  {/* Social icons */}
                  {(founder.instagram || founder.telegram) && (
                    <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100 w-full justify-center">
                      {founder.instagram && (
                        <Link
                          href={founder.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200"
                        >
                          <Instagram size={15} className="text-slate-600" />
                        </Link>
                      )}
                      {founder.telegram && (
                        <Link
                          href={founder.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-200"
                        >
                          <Send size={15} className="text-slate-600" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Back Button ── */}
        <div className="text-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-[#0f2044] hover:bg-[#1a3560] text-white px-10 py-3.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 tracking-wide"
            >
              ← Back to Home
            </motion.button>
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="text-center text-slate-400 text-xs py-8 border-t border-slate-200 tracking-wide">
        © {new Date().getFullYear()} VetDigits LMS. All rights reserved.
      </footer>
    </div>
  );
}
