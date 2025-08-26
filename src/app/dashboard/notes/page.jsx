"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function NotesList() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Notes Subjects
  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(`${API_URL}/api/notes/subjects`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load notes: ${res.status}`);
        let data = await res.json();

        // ✅ Purchased notes first
        data = (data || []).sort((a, b) => {
          if (a.is_enrolled && !b.is_enrolled) return -1;
          if (!a.is_enrolled && b.is_enrolled) return 1;
          return 0;
        });

        setNotes(data);
      } catch (err) {
        console.error("Failed to load notes subjects:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNotes();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderCircle className="animate-spin text-blue-500" size={24} />
        <span className="ml-3 text-lg text-gray-600">Loading notes…</span>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-red-500 font-semibold mb-2">Error loading notes</p>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  // Price / Enrollment Status
  const renderPriceOrStatus = (note) => {
    if (note.is_enrolled) {
      return (
        <span className="px-3 py-1 text-xs font-bold text-gray-600 border border-gray-400 rounded-full">
          Already Enrolled
        </span>
      );
    }

    const numPrice = Number(note.price);
    if (!note.price || numPrice === 0 || note.price === "0") {
      return (
        <span className="px-3 py-1 text-xs font-bold text-green-600 border border-green-600 rounded-full">
          FREE!
        </span>
      );
    }

    return (
      <span className="px-3 py-1 text-xs font-bold text-blue-600 border border-blue-600 rounded-full">
        ₹{numPrice.toLocaleString("en-IN")}
      </span>
    );
  };

  // Handle Click
  const handleClick = (note) => {
    if (note.is_enrolled) {
      router.push(`/dashboard/notes/${note.id}`);
    } else {
      router.push(`/dashboard/notes/checkout/${note.id}`);
    }
  };

  return (
    <div>
      {/* --------- MOBILE VERTICAL LIST ---------- */}
      <div className="md:hidden grid gap-6 p-4">
        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            className="cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 120 }}
            onClick={() => handleClick(note)}
          >
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
              <div className="w-full bg-gray-100 flex items-center justify-center">
                <img
                  src={note.thumbnail_url || "/placeholder.png"}
                  alt={note.name}
                  className="h-44 object-contain"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {note.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {note.description}
                </p>
                <div className="flex items-center justify-between">
                  {renderPriceOrStatus(note)}
                  <button className="text-blue-600 font-medium hover:text-blue-800">
                    {note.is_enrolled ? "Open" : "View Details"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --------- DESKTOP GRID ---------- */}
      <div className="hidden md:grid gap-8 p-6 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            className="group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 120 }}
            whileHover={{
              y: -5,
              boxShadow: "0px 10px 15px rgba(0, 0, 0, 0.1)",
            }}
            onClick={() => handleClick(note)}
          >
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                <img
                  src={note.thumbnail_url || "/placeholder.png"}
                  alt={note.name}
                  className="h-48 object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {note.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {note.description}
                </p>
                <div className="flex items-center justify-between">
                  {renderPriceOrStatus(note)}
                  <button className="text-blue-600 font-medium hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {note.is_enrolled ? "Open" : "View Details"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
