'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function CoursesList({ apiUrl, onSelect }) {
  const { user, loading: userLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carousel state
  const [currentIdx, setCurrentIdx] = useState(0);
  const autoScrollRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    fetch(`${apiUrl}/api/courses`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCourses(data || []))
      .catch(err => console.error('Failed to load courses', err))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  useEffect(() => {
    if (!courses.length) return;
    autoScrollRef.current = setInterval(() => {
      setCurrentIdx(idx => (idx + 1) % courses.length);
    }, 4000);
    return () => clearInterval(autoScrollRef.current);
  }, [courses.length]);

  useEffect(() => {
    if (cardRefs.current[currentIdx]) {
      cardRefs.current[currentIdx].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [currentIdx]);

  function handleManual(idx) {
    setCurrentIdx(idx);
    clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      setCurrentIdx(i => (i + 1) % courses.length);
    }, 4000);
  }

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderCircle className="animate-spin text-blue-500" size={24} />
        <span className="ml-3 text-lg text-gray-600">Loading courses…</span>
      </div>
    );
  }

  const enrolledIds = user?.enrolledCourses?.map(c => c.id.toString()) || [];

  return (
    <div>
      {/* --------- MOBILE CAROUSEL ---------- */}
      <div className="relative md:hidden">
        {/* Helper text */}
        <div className="flex items-center justify-center mb-2 gap-1 text-sm text-gray-500 select-none">
          <span className="hidden sm:inline">Scroll or swipe</span>
          <span className="sm:hidden">Swipe</span> to see all courses
          <svg width="18" height="18" className="ml-1 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
        </div>
        {/* Left Arrow */}
        <button
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow border border-gray-200"
          style={{ display: courses.length > 1 ? undefined : "none" }}
          onClick={() => handleManual((currentIdx - 1 + courses.length) % courses.length)}
          disabled={courses.length <= 1}
          aria-label="Previous Course"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>
        </button>
        {/* Right Arrow */}
        <button
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow border border-gray-200"
          style={{ display: courses.length > 1 ? undefined : "none" }}
          onClick={() => handleManual((currentIdx + 1) % courses.length)}
          disabled={courses.length <= 1}
          aria-label="Next Course"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
        </button>
        {/* Carousel */}
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-2 pb-4 no-scrollbar">
          {courses.map((course, index) => {
            const isEnrolled = enrolledIds.includes(course.id.toString());

            return (
              <motion.div
                key={course.id}
                className="min-w-[85vw] max-w-[85vw] snap-center cursor-pointer"
                ref={el => cardRefs.current[index] = el}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 180,
                  damping: 22
                }}
                onClick={() => {
                  onSelect(course.id);
                  handleManual(index);
                }}
                onTouchStart={() => handleManual(index)}
                onMouseDown={() => handleManual(index)}
              >
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                  <div className="w-full bg-gray-100 flex items-center justify-center">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="h-44 object-contain transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-xs mb-3 line-clamp-3">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {isEnrolled ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Already Enrolled
                        </span>
                      ) : (
                        <span className="text-base font-semibold text-gray-900">
                          ₹{course.price}
                        </span>
                      )}
                      <button
                        className="text-blue-600 font-medium hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* --------- DESKTOP GRID ---------- */}
      <div className="hidden md:grid gap-8 p-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course, index) => {
          const isEnrolled = enrolledIds.includes(course.id.toString());
          return (
            <motion.div
              key={course.id}
              className="group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 120 }}
              whileHover={{ y: -5, boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1)' }}
              onClick={() => onSelect(course.id)}
            >
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-48 object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between">
                    {isEnrolled ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                        Already Enrolled
                      </span>
                    ) : (
                      <span className="text-lg font-medium text-gray-900">
                        ₹{course.price}
                      </span>
                    )}
                    <button
                      className="text-blue-600 font-medium hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
