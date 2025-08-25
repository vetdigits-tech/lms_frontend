"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Download } from "lucide-react";

export default function NoteChaptersPage() {
  const { id } = useParams(); 
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchChapters = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notes/subjects/${id}/chapters`
        );

        if (!res.ok) throw new Error(`Error ${res.status}`);

        let data = await res.json();
        data = data.sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0]) || 0;
          const numB = parseInt(b.name.match(/\d+/)?.[0]) || 0;
          return numA - numB;
        });

        setChapters(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load chapters");
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, [id]);

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
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        📚 Chapters
      </h1>

      {chapters.length === 0 ? (
        <p className="text-center text-gray-500">No chapters found for this subject.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="group bg-white border rounded-2xl shadow hover:shadow-lg transition-all duration-300 p-5 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-blue-600 w-6 h-6" />
                <h2 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                  {chapter.name}
                </h2>
              </div>

              {chapter.pdf_url ? (
                <a
                  href={chapter.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              ) : (
                <span className="text-gray-400 text-sm">No file available</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
