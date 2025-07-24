'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { CloudUpload, UserCircle2, Lock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.name || '');
      setPhotoURL(user.photo_url || '');
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <p className="text-blue-700">Loading...</p>
      </div>
    );
  }

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: form }
      );
      const data = await res.json();
      if (data.secure_url) {
        setPhotoURL(data.secure_url);
        toast.success('Image uploaded!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const xsrf = getCookie('XSRF-TOKEN');
      const res = await fetch(`${API_URL}/api/user`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf },
        body: JSON.stringify({ display_name: displayName, photo_url: photoURL }),
      });
      if (!res.ok) throw new Error('Profile update failed');
      toast.success('Profile updated!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error('Fill all password fields');
      return;
    }
    setSavingPassword(true);
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const xsrf = getCookie('XSRF-TOKEN');
      const res = await fetch(`${API_URL}/api/user/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf },
        body: JSON.stringify({ current_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      toast.success(data.message || 'Password updated!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Password update failed');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-10 px-4">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="absolute top-4 left-4">
            <Link href="/dashboard" className="text-white hover:underline inline-flex items-center gap-1">
              ← Back
            </Link>
          </div>
          <div className="flex flex-col items-center pt-6">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Avatar"
                className="h-24 w-24 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-blue-600">
                <UserCircle2 className="h-16 w-16" />
              </div>
            )}
            <h1 className="mt-4 text-2xl font-semibold text-white">Edit Profile</h1>
          </div>
        </div>

        <div className="p-8">
          {/* Profile Form */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg border-gray-300 p-3 shadow-sm focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (read-only)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="mt-1 w-full rounded-lg border bg-gray-100 p-3 text-gray-500"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
            <label className="mt-1 flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-blue-400">
              {uploading ? (
                <CloudUpload className="animate-spin" size={32} />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <CloudUpload size={32} />
                  <span className="mt-2 text-sm">Click or drop to upload</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {photoURL && (
              <p className="mt-2 text-sm text-gray-600">Current photo will update on save.</p>
            )}
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="mt-8 w-full rounded-lg bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>

          {/* Password Section */}
          {user.has_password && (
            <div className="mt-10 border-t pt-8">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-800">
                <Lock size={20} /> Change Password
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-lg border-gray-300 p-3 shadow-sm focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-lg border-gray-300 p-3 shadow-sm focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="mt-6 w-full rounded-lg bg-yellow-500 px-6 py-3 text-white shadow hover:bg-yellow-600 disabled:opacity-50"
              >
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
