'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardCourses from '@/components/DashboardCourses';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openChapters, setOpenChapters] = useState(new Set());
  const [videosByChapter, setVideosByChapter] = useState({});
  const [modalVideo, setModalVideo] = useState(null);

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isPortrait = useMediaQuery({ query: '(orientation: portrait)' });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Safe redirect: only call replace inside useEffect
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // 1) Loading spinner while auth state is pending
  if (loading) {
    return <FullScreenSpinner />;
  }

  // 2) If unauthenticated, render nothing (redirect happens in useEffect)
  if (!user) {
    return null;
  }

  // 3) Helper to select a course and fetch its chapters
  const selectCourse = async (course) => {
    try {
      const res = await fetch(
        `${API_URL}/api/courses/${course.id}/chapters`,
        { credentials: 'include' }
      );
      const chapters = await res.json();
      setSelectedCourse({ ...course, chapters });
    } catch (err) {
      console.error('Failed to load chapters', err);
    }
  };

  // Cookie helper for Drive API calls
  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp('(^|; )' + name + '=([^;]+)')
    );
    return match ? decodeURIComponent(match[2]) : '';
  }

  return (
    <div className="text-gray-800 w-full">
      <h2 className="mb-6 text-2xl font-bold">
        👋 Hello, {user.display_name || user.name || user.email}
      </h2>

      {!selectedCourse && (
        <DashboardCourses
          enrolledCourses={user.enrolledCourses || []}
          isLoading={false}
          onSelectCourse={selectCourse}
        />
      )}

      {selectedCourse && (
        <section>
          <button
            onClick={() => setSelectedCourse(null)}
            className="mb-4 inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Courses
          </button>

          <h3 className="text-2xl font-bold">{selectedCourse.title}</h3>
          <p className="mb-6 text-gray-900">{selectedCourse.description}</p>

          {selectedCourse.chapters?.map((chap, idx) => {
            const key = `${selectedCourse.id}-${idx}`;
            const isOpen = openChapters.has(key);
            const videos = videosByChapter[key];

            return (
              <div
                key={key}
                className="mb-4 overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                <button
                  onClick={() => {
                    setOpenChapters((prev) => {
                      const next = new Set(prev);
                      next.has(key) ? next.delete(key) : next.add(key);
                      return next;
                    });
                    if (!videosByChapter[key]) {
                      loadDriveVideos(chap.drive_folder_id, key);
                    }
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-lg font-medium">{chap.title}</span>
                  {isOpen ? <ChevronUp /> : <ChevronDown />}
                </button>

                <div
                  className={`grid ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  } transition-[grid-template-rows] duration-300 ease-in-out`}
                >
                  <div className="overflow-hidden">
                    {isOpen && (
                      <div className="p-4">
                        {!videos ? (
                          <VideoSkeletonGrid />
                        ) : videos.length === 0 ? (
                          <p className="text-sm text-gray-800">No videos found.</p>
                        ) : (
                          <VideoGrid>
                            {videos.map((v) => {
                              const vid = { ...v, folderId: chap.drive_folder_id };
                              return (
                                <VideoCard
                                  key={vid.id}
                                  video={vid}
                                  isMobile={isMobile}
                                  onClick={() => setModalVideo(vid)}
                                />
                              );
                            })}
                          </VideoGrid>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {isMobile && modalVideo && isPortrait && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center max-w-xs mx-auto">
            <div className="mb-3 text-lg font-semibold text-gray-800">
              Please rotate your device to landscape to watch the video.
            </div>
            <button
              className="mt-2 rounded bg-blue-600 px-4 py-1 text-white"
              onClick={() => setModalVideo(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isMobile && modalVideo && !isPortrait && (
        <VideoModal
          apiUrl={API_URL}
          modalVideo={modalVideo}
          onClose={() => setModalVideo(null)}
        />
      )}
    </div>
  );

  // fetch Drive videos
  async function loadDriveVideos(folderId, key) {
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const res = await fetch(`${API_URL}/api/drive/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
        },
        credentials: 'include',
        body: JSON.stringify({ folderId }),
      });
      const { videos } = await res.json();
      setVideosByChapter((prev) => ({ ...prev, [key]: videos || [] }));
    } catch (err) {
      console.error('Error loading videos:', err);
    }
  }
}

function VideoCard({ video, isMobile, onClick }) {
  return (
    <div
      className="relative cursor-pointer min-w-[250px] max-w-xs flex-shrink-0 hover:shadow-lg transition-shadow"
      onClick={isMobile ? onClick : undefined}
    >
      <iframe
        className="h-44 w-full object-cover rounded-lg border border-gray-200 shadow-md"
        src={`https://drive.google.com/file/d/${video.id}/preview`}
        allow="autoplay"
        allowFullScreen
        title={video.name}
      />
      <div className="mt-2 text-sm font-medium truncate">{video.name}</div>
    </div>
  );
}

function VideoGrid({ children }) {
  return <div className="flex space-x-4 overflow-x-auto pb-2">{children}</div>;
}

function VideoSkeletonGrid() {
  return (
    <VideoGrid>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse h-44 w-full min-w-[250px] rounded bg-gray-200" />
      ))}
    </VideoGrid>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800">
      <LoaderCircle className="mr-2 animate-spin" />
      Loading student dashboard…
    </div>
  );
}