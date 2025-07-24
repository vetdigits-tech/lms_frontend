'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Menu } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function Navbar({ setSidebarOpen }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const profilePhoto = user?.photo_url || null;

  const handleLogout = async () => {
    try {
      await logout();               // Call context logout (API + state)
      toast.success('Logged out');
      router.replace('/login');     // SPA-friendly redirect
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
      {/* Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="block lg:hidden rounded-md border p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-blue-600">VETDIGIT LMS</h1>
      </div>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 focus:outline-none"
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="profile"
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <User size={20} className="text-gray-600" />
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white py-2 text-gray-800 shadow-lg z-50">
            <button
              onClick={() => {
                setDropdownOpen(false);
                router.push('/dashboard/profile');
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <User size={16} /> Edit Profile
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
