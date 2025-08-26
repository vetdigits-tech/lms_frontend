"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Menu, X } from "lucide-react";
import { motion } from "framer-motion";

function extractDriveFileId(url) {
  if (!url) return null;
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
  if (dMatch) return dMatch[1];
  const idParam = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
  if (idParam) return idParam[1];
  const generic = url.match(/[-\w]{25,}/);
  return generic ? generic[0] : null;
}

export default function NoteChaptersPage() {
  const params = useParams();
  const id = params?.id;

  const [chapters, setChapters] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const viewerRef = useRef(null);

  // 🔹 Request fullscreen on mobile
  const openFullscreen = async () => {
    const el = viewerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // 🔹 Fetch chapters
  useEffect(() => {
    if (!id) return;
    async function fetchChapters() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notes/subjects/${id}/chapters`
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);
        let data = await res.json();
        data = data.sort((a, b) => {
          const numA = parseInt(a.name?.match(/\d+/)?.[0] ?? "", 10) || 0;
          const numB = parseInt(b.name?.match(/\d+/)?.[0] ?? "", 10) || 0;
          return numA - numB;
        });
        setChapters(data);
        const firstWithPdf = data.find(
          (c) => c.pdf_url && extractDriveFileId(c.pdf_url)
        );
        if (firstWithPdf) setActiveId(firstWithPdf.id);
      } catch (err) {
        console.error(err);
        setError("Failed to load chapters");
      } finally {
        setLoading(false);
      }
    }
    fetchChapters();
  }, [id]);

  const activeChapter = useMemo(
    () => chapters.find((c) => c.id === activeId),
    [chapters, activeId]
  );

  const previewSrc = useMemo(() => {
    if (!activeChapter?.pdf_url) return null;
    const fileId = extractDriveFileId(activeChapter.pdf_url);
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
  }, [activeChapter]);

  const handleChapterClick = (chapterId) => {
    setActiveId(chapterId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
      setTimeout(() => openFullscreen(), 300);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600 animate-pulse">Loading chapters...</p>
      </div>
    );

  if (error)
    return (
      <p className="p-6 text-center text-red-500 font-medium">{error}</p>
    );

  return (
    <div className="flex flex-col h-screen">
      {/* 🔹 Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white shadow px-4 py-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">📚 Chapters</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 🔹 Sidebar */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: sidebarOpen || window.innerWidth >= 1024 ? 0 : "-100%" }}
          transition={{ duration: 0.3 }}
          className="fixed lg:static z-50 w-72 bg-gray-100 border-r overflow-y-auto h-full"
        >
          <div className="flex justify-between items-center p-4 lg:hidden">
            <h2 className="text-xl font-semibold">Chapters</h2>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {chapters.map((chapter) => {
              const fileId = extractDriveFileId(chapter.pdf_url);
              const isDisabled = !fileId;
              const isActive = activeId === chapter.id;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => !isDisabled && handleChapterClick(chapter.id)}
                  disabled={isDisabled}
                  className={`w-full text-left p-3 rounded-lg shadow-sm transition ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "bg-white hover:bg-gray-200"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{chapter.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 🔹 PDF Viewer */}
        <div className="flex-1 bg-gray-50 flex">
          <div
            ref={viewerRef}
            className="flex-1 bg-white border rounded-xl shadow overflow-hidden m-4"
          >
            {previewSrc ? (
              <iframe
                key={previewSrc}
                src={previewSrc}
                className="w-full h-full"
                style={{ minHeight: "calc(100vh - 2rem)" }}
                frameBorder="0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a chapter with a PDF to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
