'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Combobox } from '@headlessui/react';

export default function EnrollStudentsPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [unenrolledOptions, setUnenrolledOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const getCsrfToken = async () => {
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
      });
    } catch (err) {
      console.error('Failed to get CSRF token:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/courses`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      toast.error('Failed to load courses');
    }
  };

  // Always returns array
  const fetchUnenrolledUsers = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await fetch(`${API_URL}/api/users/unenrolled/${courseId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      setUnenrolledOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch unenrolled users:', err);
      toast.error('Failed to fetch unenrolled users');
      setUnenrolledOptions([]); // fallback to empty array
    }
  };

  const fetchEnrollments = async (courseId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}/enrollments`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (e) => {
    const courseId = e.target.value;
    setSelectedCourseId(courseId);
    setEnrollments([]);
    setSelectedUser(null);
    setQuery('');
    if (courseId) {
      fetchEnrollments(courseId);
      fetchUnenrolledUsers(courseId); // Fetch users for this course
    }
  };

  const handleEnroll = async () => {
    if (!selectedUser || !selectedCourseId) {
      toast.error('Select a student and course');
      return;
    }

    try {
      await getCsrfToken();
      const xsrfToken = getCookie('XSRF-TOKEN');

      const enrollRes = await fetch(
        `${API_URL}/api/admin/enroll/${selectedUser.id}/${selectedCourseId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
          },
          body: JSON.stringify({
            user_id: selectedUser.id,
          }),
        }
      );

      if (!enrollRes.ok) {
        const errorData = await enrollRes.json();
        throw new Error(errorData.message || 'Enrollment failed');
      }

      // ✅ Grant access to all chapter folders
      const folderRes = await fetch(`${API_URL}/api/courses/${selectedCourseId}/chapters`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const chapterData = await folderRes.json();
      const folders = Array.isArray(chapterData)
        ? chapterData.filter(ch => ch.drive_folder_id).map(ch => ch.drive_folder_id)
        : [];

      await Promise.all(
        folders.map(folderId =>
          fetch(`${API_URL}/api/drive/grant-access`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-XSRF-TOKEN': xsrfToken,
            },
            body: JSON.stringify({
              user_id: selectedUser.id,
              folder_id: folderId,
            }),
          })
        )
      );

      toast.success('Student enrolled and access granted');
      setSelectedUser(null);
      setQuery('');
      fetchEnrollments(selectedCourseId);
      fetchUnenrolledUsers(selectedCourseId); // fetch again after enrolling
    } catch (err) {
      console.error('Enroll error:', err);
      toast.error(err.message || 'Error enrolling student');
    }
  };

  const handleRemove = async (enrollmentId) => {
    if (!confirm('Remove this student?')) return;

    try {
      await getCsrfToken();
      const xsrfToken = getCookie('XSRF-TOKEN');

      // Get enrollment first to find user + course
      const enrollment = enrollments.find(e => e.id === enrollmentId);
      if (!enrollment || !enrollment.user_id) throw new Error('User info missing');

      // Fetch folders before removing
      const chapterRes = await fetch(`${API_URL}/api/courses/${selectedCourseId}/chapters`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const chapters = await chapterRes.json();
      const folders = Array.isArray(chapters)
        ? chapters.filter(ch => ch.drive_folder_id).map(ch => ch.drive_folder_id)
        : [];

      // Proceed to remove
      const removeRes = await fetch(`${API_URL}/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrfToken,
        },
      });

      if (!removeRes.ok) {
        const errorData = await removeRes.json();
        throw new Error(errorData.message || 'Removal failed');
      }

      // ✅ Revoke Google Drive Access
      await Promise.all(
        folders.map(folderId =>
          fetch(`${API_URL}/api/drive/revoke-access`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-XSRF-TOKEN': xsrfToken,
            },
            body: JSON.stringify({
              user_id: enrollment.user_id,
              folder_id: folderId,
            }),
          })
        )
      );

      toast.success('Student removed and access revoked');
      fetchEnrollments(selectedCourseId);
      fetchUnenrolledUsers(selectedCourseId); // fetch again after removing
    } catch (err) {
      console.error('Remove error:', err);
      toast.error(err.message || 'Error removing student');
    }
  };

  // **Always an array**
  const filteredOptions = Array.isArray(unenrolledOptions)
    ? (
        query
          ? unenrolledOptions.filter((u) => {
              const term = query.toLowerCase();
              return (u.name || u.email).toLowerCase().includes(term);
            })
          : unenrolledOptions
      )
    : [];

  const getLabel = (user) => (user.name ? `${user.name} – ${user.email}` : user.email);

  useEffect(() => {
    fetchCourses();
    // Don't fetch unenrolled users until a course is selected!
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 lg:px-8 text-gray-900">
      <Link href="/admin">
        <button className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-800 hover:underline">
          ← Back to Dashboard
        </button>
      </Link>
      <h1 className="mb-8 text-2xl font-bold text-blue-700">Enroll / Remove Students</h1>
      <section className="rounded-lg border bg-white shadow-sm">
        <div className="rounded-t-lg bg-blue-50 px-6 py-4 text-blue-800 font-semibold">
          Course &amp; Student Selection
        </div>
        <div className="space-y-6 px-6 py-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={handleSelectCourse}
              className="w-full rounded border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title || course.name}
                </option>
              ))}
            </select>
          </div>
          {selectedCourseId && (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Select Student to Enroll
                  </label>
                  <Combobox value={selectedUser} onChange={setSelectedUser} nullable>
                    <div className="relative">
                      <Combobox.Input
                        className="w-full rounded border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search name or email…"
                        displayValue={(user) => (user ? getLabel(user) : '')}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                        {filteredOptions.length === 0 && (
                          <div className="cursor-default select-none px-4 py-2 text-gray-500">
                            No matches found
                          </div>
                        )}
                        {filteredOptions.map((user) => (
                          <Combobox.Option
                            key={user.id}
                            value={user}
                            className={({ active }) =>
                              `relative cursor-pointer select-none px-4 py-2 ${
                                active ? 'bg-blue-600 text-white' : 'text-gray-900'
                              }`
                            }
                          >
                            {getLabel(user)}
                          </Combobox.Option>
                        ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                </div>
                <button
                  onClick={handleEnroll}
                  className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-5 py-2 font-medium text-white shadow hover:bg-blue-700 sm:w-auto"
                >
                  Enroll
                </button>
              </div>
              <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Enrolled Students</h2>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    Loading…
                  </div>
                ) : enrollments.length === 0 ? (
                  <p className="text-sm text-gray-700">No students enrolled yet.</p>
                ) : (
                  <ul className="overflow-hidden rounded-md border border-gray-200">
                    {enrollments.map((enrollment) => (
                      <li
                        key={enrollment.id}
                        className="flex items-center justify-between gap-4 bg-white px-4 py-2 odd:bg-gray-50"
                      >
                        <span className="break-all text-sm text-gray-900">
                          {enrollment.user ? getLabel(enrollment.user) : `User ID: ${enrollment.user_id}`}
                        </span>
                        <button
                          onClick={() => handleRemove(enrollment.id)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
