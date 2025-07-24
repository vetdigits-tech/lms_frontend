import { Menu } from 'lucide-react';

export default function SidebarToggle({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
    >
      <span className="sr-only">Open sidebar</span>
      <Menu className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
