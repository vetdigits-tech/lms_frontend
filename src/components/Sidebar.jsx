// File: src/components/Sidebar.jsx
'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Notebook,
  X,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import DarkModeToggle from '@/components/DarkModeToggle';
import { useTheme } from '@/context/theme-provider';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Courses', path: '/dashboard/courses', icon: <BookOpen size={16} /> },
  { label: 'Notes', path: '/dashboard/notes', icon: <Notebook size={16} /> },
  { label: 'Quizzes', path: '/dashboard/quizzes', icon: <ClipboardList size={16} /> },
  { label: 'Support', path: '/dashboard/support', icon: <HelpCircle size={16} /> },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { isDark } = useTheme();

  const bgClass = isDark ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  const linkText = isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100';
  const activeBg = isDark ? 'bg-blue-700/20 text-blue-200' : 'bg-blue-100 text-blue-700';

  const renderSidebarContent = (onItemClick) => (
    <>
      <div className="p-6">
        <h2 className="mb-8 text-2xl font-extrabold text-blue-600">Menu</h2>
        <ul className="space-y-4">
          {menuItems.map((item) => {
            const isActive =
              item.path === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={onItemClick}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${
                    isActive ? activeBg : linkText
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-auto p-4">
        <DarkModeToggle className="w-full justify-center" />
        <div className="mt-3 space-y-2 text-center">
          <Link
            href="/about/privacy"
            className={`flex items-center justify-center gap-1 text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
          >
            <ShieldCheck size={14} />
            Privacy Policy
          </Link>
          <Link
            href="/about/terms"
            className={`flex items-center justify-center gap-1 text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
          >
            <FileText size={14} />
            Terms & Conditions
          </Link>
        </div>
        <p className={`mt-3 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          © 2025 LMS
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Transition.Root show={Boolean(isOpen)} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 lg:hidden"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className={`${bgClass} border-r fixed inset-y-0 left-0 w-64 shadow-xl flex flex-col`}>
              <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              {renderSidebarContent(() => setIsOpen(false))}
            </div>
          </Transition.Child>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <aside className={`${bgClass} hidden lg:flex h-screen w-64 flex-col border-r shadow-sm`}>
        {renderSidebarContent()}
      </aside>
    </>
  );
}
