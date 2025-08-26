// File: src/app/admin/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, ClipboardList, FileText, LogOut as LogOutIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

// Helper to read cookie
function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(^|; )' + name + '=([^;]+)')
  );
  return match ? decodeURIComponent(match[2]) : '';
}

// Clear specified cookies
function clearCookies(names) {
  names.forEach(name => {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect if not authorized
  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.replace('/login');
      } else if (user.role !== 'admin') {
        toast.error('Access denied');
        window.location.replace('/');
      }
    }
  }, [user, loading]);

  // Prevent back-button cache
  useEffect(() => {
    const onShow = event => {
      if (event.persisted && !user) window.location.replace('/login');
    };
    const onPop = () => {
      if (!user) window.location.replace('/login');
    };
    window.addEventListener('pageshow', onShow);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('pageshow', onShow);
      window.removeEventListener('popstate', onPop);
    };
  }, [user]);

  // Logout: endpoint + clear context + clear cookies + replace
  const handleLogout = async () => {
    try {
      // CSRF
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      // Logout
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
        method: 'POST', credentials: 'include', headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
        }
      });
      // Clear local state & cookies
      logout();
      clearCookies(['XSRF-TOKEN', 'laravel_session', 'laravel_token', 'session']);
      toast.success('Logged out');
      // Hard redirect
      window.location.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      toast.error('Logout failed');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        Checking admin access…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600">Admin Dashboard</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
          <LogOutIcon className="w-5 h-5" /> Logout
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard icon={<BookOpen className="w-8 h-8 text-blue-500" />} title="Manage Courses" href="/admin/courses" />
        <DashboardCard icon={<Users className="w-8 h-8 text-green-500" />} title="Enroll / Remove Students" href="/admin/enrollments" />
        <DashboardCard icon={<ClipboardList className="w-8 h-8 text-purple-500" />} title="Manage Quizzes" href="/admin/quizzes" />
        <DashboardCard icon={<FileText className="w-8 h-8 text-yellow-500" />} title="Manage Notes" href="/admin/assignments" />
        <DashboardCard icon={<FileText className="w-8 h-8 text-yellow-500" />} title="Manage Notes Students" href="/admin/notes" />
      </div>
    </main>
  );
}

function DashboardCard({ icon, title, href }) {
  return (
    <Link href={href} className="block">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:scale-105 hover:shadow-xl transition cursor-pointer h-full flex flex-col justify-center items-start">
        {icon}
        <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Click to manage</p>
      </div>
    </Link>
  );
}
