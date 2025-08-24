"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function NoteChaptersPage() {
  const { id } = useParams(); // subjectId from URL
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

        // ✅ Sort chapters numerically (Chapter 1 first)
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

  if (loading) return <p className="p-6">Loading chapters...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Chapters</h1>

      {chapters.length === 0 ? (
        <p>No chapters found for this subject.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="border rounded-lg shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-lg mb-3">{chapter.name}</span>
              {chapter.pdf_url ? (
                <a
                  href={chapter.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Download
                </a>
              ) : (
                <span className="text-gray-400">No file</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
