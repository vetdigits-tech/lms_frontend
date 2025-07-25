'use client';

import { useEffect, useState } from 'react';
import { FaLock } from 'react-icons/fa';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CourseDetails({ apiUrl, courseId, onBack }) {
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load course
  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/courses/${courseId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        setCourse(data);
      } catch (e) {
        console.error('Failed to load course', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiUrl, courseId]);

  if (userLoading) return <p className="py-6 text-center text-gray-500">Loading user data...</p>;
  if (loading)    return <p className="py-6 text-center text-gray-500">Loading course...</p>;
  if (!course || course.message)
    return <p className="py-6 text-center text-red-500">Course not found.</p>;

  const enrolledIds = (user?.enrolledCourses || []).map(c => c.id.toString());
  const isEnrolled = enrolledIds.includes(course.id.toString());

  // Updated enroll handler: full reload of /dashboard
  const handleEnroll = async () => {
    setProcessing(true);
    try {
      // 1) CSRF cookie
      await fetch(`${apiUrl}/sanctum/csrf-cookie`, { credentials: 'include' });
      // 2) Extract token
      const raw = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1] || '';
      const xsrf = decodeURIComponent(raw);
      // 3) POST to enroll
      const res = await fetch(
        `${apiUrl}/api/courses/${course.id}/enroll`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': xsrf,
          },
        }
      );
      if (res.ok) {
        // full reload so dashboard re-fetches
        window.location.href = '/dashboard';
      } else {
        let errBody;
        try { errBody = await res.json(); }
        catch { errBody = { message: `Status ${res.status}` }; }
        alert(errBody.message || 'Enrollment failed');
        setProcessing(false);
      }
    } catch (e) {
      console.error('Enroll error', e);
      alert('Unexpected error—check console');
      setProcessing(false);
    }
  };

  const handleBuyNow = () => router.push(`/checkout/${course.id}`);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 md:px-0">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-md lg:max-w-4xl">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-1 text-base font-medium"
          >
            ← Back to Courses
          </button>

          {/* MOBILE CARD */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mx-auto mb-4 w-full max-w-[95vw] md:hidden">
            <div className="flex flex-col items-center">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full max-w-xs h-36 object-contain rounded-lg bg-gray-100 mb-4 shadow"
                loading="eager"
              />
              <h1 className="text-xl font-bold text-gray-900 text-center mb-2">{course.title}</h1>

              <div className="mb-3">
                {!isEnrolled ? (
                  parseFloat(course.price) === 0 ? (
                    <button
                      onClick={handleEnroll}
                      disabled={processing}
                      className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
                    >
                      {processing ? (
                        <>
                          <LoaderCircle className="animate-spin mr-2" size={16} />
                          Providing access…
                        </>
                      ) : (
                        'Free — Enroll Now'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleBuyNow}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
                    >
                      Buy Now — ₹{course.price}
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="bg-green-100 text-green-700 font-semibold px-5 py-2 rounded-lg shadow cursor-not-allowed"
                  >
                    Already Enrolled
                  </button>
                )}
              </div>

              <p className="text-gray-700 text-center text-sm mb-4 leading-relaxed">
                {course.description}
              </p>

              <button
                onClick={() => setShowChapters(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 rounded-lg transition shadow"
              >
                View Chapters ({course.chapters.length})
              </button>
            </div>
          </div>

          {/* DESKTOP CARD */}
          <div className="hidden md:flex bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto mb-4">
            <div className="flex-shrink-0 flex items-center justify-center bg-gray-100 w-80 h-72">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="object-contain h-56 w-64"
                loading="eager"
              />
            </div>
            <div className="flex flex-col justify-center px-10 py-8 w-full">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <div className="mb-4">
                {!isEnrolled ? (
                  parseFloat(course.price) === 0 ? (
                    <button
                      onClick={handleEnroll}
                      disabled={processing}
                      className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition mb-2"
                    >
                      {processing ? (
                        <>
                          <LoaderCircle className="animate-spin mr-2" size={18} />
                          Providing access…
                        </>
                      ) : (
                        'Free — Enroll Now'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleBuyNow}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition mb-2"
                    >
                      Buy Now — ₹{course.price}
                    </button>
                  )
                ) : (
                  <span className="inline-block bg-green-100 text-green-700 font-semibold px-5 py-2 rounded-lg mb-2">
                    Already Enrolled
                  </span>
                )}
              </div>

              <p className="text-gray-700 text-base mb-6 leading-relaxed">
                {course.description}
              </p>

              <button
                onClick={() => setShowChapters(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 rounded-lg transition"
              >
                View Chapters ({course.chapters.length})
              </button>
            </div>
          </div>

          {/* CHAPTERS MODAL */}
          {showChapters && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-t-2xl md:rounded-lg shadow-lg w-full max-w-md mx-auto p-5 animate-fadeInUp md:animate-none">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Chapters</h2>
                  <button
                    onClick={() => setShowChapters(false)}
                    className="text-gray-400 hover:text-blue-600 rounded-full focus:outline-none"
                    aria-label="Close"
                  >
                    <svg height="24" width="24" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 8.586l4.95-4.95a1 1 0 111.414 1.415l-4.95 4.95 4.95 4.95a1 1 0 01-1.414 1.415l-4.95-4.95-4.95 4.95a1 1 0 01-1.415-1.415l4.95-4.95-4.95-4.95A1 1 0 015.05 3.636l4.95 4.95z" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pb-2">
                  {course.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                    >
                      <span className="text-gray-800 font-medium">{ch.title}</span>
                      <FaLock className="text-gray-600" />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowChapters(false)}
                  className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .animate-fadeInUp {
            animation: fadeInUp 0.25s cubic-bezier(.39,.575,.565,1) both;
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(60px);}
            100% { opacity: 1; transform: translateY(0);}
          }
        }
      `}</style>
    </div>
  );
}
