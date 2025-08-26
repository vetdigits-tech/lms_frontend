'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Combobox } from '@headlessui/react';

export default function ManageNotesAccessPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [unpurchasedUsers, setUnpurchasedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Helpers
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const getCsrfToken = async () => {
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
    } catch (err) {
      console.error('Failed to get CSRF token:', err);
    }
  };

  // Fetch all note subjects
  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notes/subjects`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      toast.error('Failed to load note subjects');
    }
  };

  const fetchPurchases = async (subjectId) => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notes/${subjectId}/purchases`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpurchasedUsers = async (subjectId) => {
    if (!subjectId) return;
    try {
      const res = await fetch(`${API_URL}/api/notes/${subjectId}/unpurchased-users`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      setUnpurchasedUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to fetch users');
      setUnpurchasedUsers([]);
    }
  };

  const handleSelectSubject = (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectId(subjectId);
    setPurchases([]);
    setSelectedUser(null);
    setQuery('');
    if (subjectId) {
      fetchPurchases(subjectId);
      fetchUnpurchasedUsers(subjectId);
    }
  };

  const handleGiveAccess = async () => {
    if (!selectedUser || !selectedSubjectId) {
      toast.error('Select a student and note');
      return;
    }

    try {
      await getCsrfToken();
      const xsrfToken = getCookie('XSRF-TOKEN');

      const res = await fetch(
        `${API_URL}/api/admin/notes/${selectedUser.id}/${selectedSubjectId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to give access');
      }

      toast.success('Access granted successfully');
      setSelectedUser(null);
      setQuery('');
      fetchPurchases(selectedSubjectId);
      fetchUnpurchasedUsers(selectedSubjectId);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error granting access');
    }
  };

  const handleRemove = async (purchaseId) => {
    if (!confirm('Remove this student\'s access?')) return;

    try {
      await getCsrfToken();
      const xsrfToken = getCookie('XSRF-TOKEN');

      const res = await fetch(`${API_URL}/api/notes/purchase/${purchaseId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrfToken,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to remove');
      }

      toast.success('Access revoked successfully');
      fetchPurchases(selectedSubjectId);
      fetchUnpurchasedUsers(selectedSubjectId);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error revoking access');
    }
  };

  const filteredOptions = query
    ? unpurchasedUsers.filter((u) => {
        const term = query.toLowerCase();
        return (u.name || u.email).toLowerCase().includes(term);
      })
    : unpurchasedUsers;

  const getLabel = (u) => (u.name ? `${u.name} – ${u.email}` : u.email);

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 lg:px-8 text-gray-900">
      <Link href="/admin">
        <button className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-800 hover:underline">
          ← Back to Dashboard
        </button>
      </Link>
      <h1 className="mb-8 text-2xl font-bold text-blue-700">Manage Notes Access</h1>
      <section className="rounded-lg border bg-white shadow-sm">
        <div className="rounded-t-lg bg-blue-50 px-6 py-4 text-blue-800 font-semibold">
          Notes &amp; Student Selection
        </div>
        <div className="space-y-6 px-6 py-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Select Note</label>
            <select
              value={selectedSubjectId}
              onChange={handleSelectSubject}
              className="w-full rounded border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a note --</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSubjectId && (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Select Student
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
                  onClick={handleGiveAccess}
                  className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-5 py-2 font-medium text-white shadow hover:bg-blue-700 sm:w-auto"
                >
                  Give Access
                </button>
              </div>

              <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Students with Access</h2>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    Loading…
                  </div>
                ) : purchases.length === 0 ? (
                  <p className="text-sm text-gray-700">No students have access yet.</p>
                ) : (
                  <ul className="overflow-hidden rounded-md border border-gray-200">
                    {purchases.map((purchase) => (
                      <li
                        key={purchase.id}
                        className="flex items-center justify-between gap-4 bg-white px-4 py-2 odd:bg-gray-50"
                      >
                        <span className="break-all text-sm text-gray-900">
                          {purchase.user ? getLabel(purchase.user) : `User ID: ${purchase.user_id}`}
                        </span>
                        <button
                          onClick={() => handleRemove(purchase.id)}
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
