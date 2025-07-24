// File: src/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout"; // wraps theme, auth, toast, etc.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "VetDigit LMS",
  description: "Learning Management System",
   icons: {
    icon: '/favicon.png', // ✅ This line adds the favicon
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200`}
      >
        {/* Client-side wrappers: theme, auth, session, toast */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
