'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function CoursesList({ apiUrl, onSelect }) {
  const { user, loading: userLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/courses`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setCourses(data || []))
      .catch((err) => console.error('Failed to load courses', err))
      .finally(() => setLoading(false));
  }, [apiUrl]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderCircle className="animate-spin text-blue-500" size={24} />
        <span className="ml-3 text-lg text-gray-600">Loading courses…</span>
      </div>
    );
  }

  const enrolledIds = user?.enrolledCourses?.map((c) => c.id.toString()) || [];

  return (
    <div>
      {/* --------- MOBILE VERTICAL LIST ---------- */}
      <div className="flex flex-col gap-6 px-2 md:hidden">
        {courses.map((course, index) => {
          const isEnrolled = enrolledIds.includes(course.id.toString());
          return (
            <motion.div
              key={course.id}
              className="cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 120 }}
              onClick={() => onSelect(course.id)}
            >
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
                <div className="w-full bg-gray-100 flex items-center justify-center">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-44 object-contain"
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
                    ) : parseFloat(course.price) === 0 ? (
                      <span className="px-3 py-1 bg-green-600 text-white uppercase font-extrabold rounded-full shadow">
                        FREE!
                      </span>
                    ) : (
                      <span className="text-base font-semibold text-gray-900">
                        ₹{course.price}
                      </span>
                    )}
                    <button className="text-blue-600 font-medium hover:text-blue-800">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
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
              whileHover={{
                y: -5,
                boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.1)',
              }}
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
                    ) : parseFloat(course.price) === 0 ? (
                      <span className="px-3 py-1 bg-green-600 text-white uppercase font-extrabold rounded-full shadow">
                        FREE!
                      </span>
                    ) : (
                      <span className="text-lg font-medium text-gray-900">
                        ₹{course.price}
                      </span>
                    )}
                    <button className="text-blue-600 font-medium hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400">
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
