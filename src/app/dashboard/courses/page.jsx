'use client';

import { useState } from 'react';
import CoursesList from '@/components/CoursesList';
import CourseDetails from '@/components/CourseDetails';

export default function CoursesPage() {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  return (
    <div className="pt-3 pr-6 pl-4 text-gray-800 w-full">
      {!selectedCourseId ? (
        <>
          <h2 className="text-2xl font-bold mb-6 text-blue-800">Available Courses</h2>
          <CoursesList
            apiUrl={API_URL}
            onSelect={(id) => setSelectedCourseId(id)}
          />
        </>
      ) : (
        <CourseDetails
          apiUrl={API_URL}
          courseId={selectedCourseId}
          onBack={() => setSelectedCourseId(null)}
        />
      )}
    </div>
  );
}
