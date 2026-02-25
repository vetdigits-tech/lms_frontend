
'use client';


import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';


export default function ManageCoursesPage() {
  // ────────────────────────────────────────────────────────────────────────────
  // Helper & Constants
  // ────────────────────────────────────────────────────────────────────────────
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };


  // Option 1: Update a single chapter’s Drive ID
  async function updateChapterDriveId(chapterId, newFolderId) {
    await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
    const xsrf = getCookie('XSRF-TOKEN');
    const res = await fetch(`${API_URL}/api/chapters/${chapterId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': xsrf,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ drive_folder_id: newFolderId }),
    });
    if (!res.ok) throw new Error(`Failed to update chapter ${chapterId}`);
    return res.json();
  }


  // ────────────────────────────────────────────────────────────────────────────
  // Forms & State
  // ────────────────────────────────────────────────────────────────────────────
  const emptyForm = () => ({
    title: '',
    price: '',
    description: '',
    thumbnail_url: '',
    chapters: [{ id: null, title: '', drive_folder_id: '', isRestricted: false }],
  });


  const [form, setForm] = useState(emptyForm());
  const [editForm, setEditForm] = useState(emptyForm());
  const [selectedEditId, setSelectedEditId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);


  // ────────────────────────────────────────────────────────────────────────────
  // Handlers: Form Fields
  // ────────────────────────────────────────────────────────────────────────────
  const handleChange = (e, isEdit = false) => {
    const { name, value } = e.target;
    const target = isEdit ? { ...editForm } : { ...form };
    target[name] = value;
    isEdit ? setEditForm(target) : setForm(target);
  };


  const handleChapterField = (index, field, value, isEdit = false) => {
    const target = isEdit ? { ...editForm } : { ...form };
    const chapters = [...target.chapters];
    chapters[index][field] = value;
    if (field === 'drive_folder_id') chapters[index].isRestricted = false;
    const updated = { ...target, chapters };
    isEdit ? setEditForm(updated) : setForm(updated);
  };


  const addChapter = (isEdit = false) => {
    const target = isEdit ? editForm : form;
    const chapters = [...target.chapters, { id: null, title: '', drive_folder_id: '', isRestricted: false }];
    (isEdit ? setEditForm : setForm)({ ...target, chapters });
  };


  const removeChapter = (index, isEdit = false) => {
    const target = isEdit ? editForm : form;
    const chapters = target.chapters.filter((_, i) => i !== index);
    (isEdit ? setEditForm : setForm)({ ...target, chapters });
  };


  // ────────────────────────────────────────────────────────────────────────────
  // Handlers: File Upload & Restrict
  // ────────────────────────────────────────────────────────────────────────────
  const handleFileUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const data = new FormData();
      data.append('file', file);
      const xsrfToken = getCookie('XSRF-TOKEN');
      const res = await fetch(
        `${API_URL}/api/upload-thumbnail`,
        { method: 'POST', body: data, credentials: 'include', headers: { 'X-XSRF-TOKEN': xsrfToken, 'Accept': 'application/json' } }
      );
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      (isEdit ? setEditForm : setForm)(prev => ({ ...prev, thumbnail_url: url }));
      toast.success('Thumbnail uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };


  const handleRemoveThumbnail = async (isEdit = false) => {
    const state = isEdit ? editForm : form;
    if (!state.thumbnail_url) return;
    setUploading(true);
    try {
      const xsrfToken = getCookie('XSRF-TOKEN');
      await fetch(`${API_URL}/api/delete-thumbnail`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrfToken },
        body: JSON.stringify({ url: state.thumbnail_url }),
      });
      (isEdit ? setEditForm : setForm)(prev => ({ ...prev, thumbnail_url: '' }));
      toast.success('Thumbnail removed!');
    } catch {
      toast.error('Failed to remove thumbnail.');
    } finally {
      setUploading(false);
    }
  };


  const handleRestrictAndPreventDownload = async (index, folder_id, isEdit = false) => {
    if (!folder_id) return toast.error('Please enter a folder ID first.');
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const xsrfToken = getCookie('XSRF-TOKEN');
      const res = await fetch(`${API_URL}/api/admin/restrict-download-folder`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrfToken },
        body: JSON.stringify({ folderId: folder_id }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Failed to restrict and prevent download.');
      toast.success(data.message);
      const updater = isEdit ? setEditForm : setForm;
      updater(prev => {
        const chapters = [...prev.chapters];
        chapters[index].isRestricted = true;
        return { ...prev, chapters };
      });
    } catch {
      toast.error('Request failed.');
    }
  };


  // ────────────────────────────────────────────────────────────────────────────
  // Select & Edit Course
  // ────────────────────────────────────────────────────────────────────────────
  const handleEditSelect = (e) => {
    const id = e.target.value;
    setSelectedEditId(id);
    const course = courses.find(c => c.id === parseInt(id));
    if (!course) return;
    setEditForm({
      title: course.title,
      price:  course.price || '',
      description: course.description || '',
      thumbnail_url: course.thumbnail_url || '',
      chapters: course.chapters.length > 0
        ? course.chapters.map(ch => ({ id: ch.id, title: ch.title || '', drive_folder_id: ch.drive_folder_id || '', isRestricted: true }))
        : [{ id: null, title: '', drive_folder_id: '', isRestricted: false }],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // ────────────────────────────────────────────────────────────────────────────
  // Submit: Create or Update Course + Option1 Chapter Updates
  // ────────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e, isEdit = false) => {
    e.preventDefault();
    const target = isEdit ? editForm : form;
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const xsrfToken = getCookie('XSRF-TOKEN');
      const payload = { title: target.title, price: target.price, description: target.description, thumbnail_url: target.thumbnail_url };
      const url = isEdit ? `${API_URL}/api/courses/${selectedEditId}` : `${API_URL}/api/courses`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrfToken, 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      // If editing, update each chapter's Drive ID
      if (isEdit) await Promise.all(editForm.chapters.map(ch => updateChapterDriveId(ch.id, ch.drive_folder_id)));
      toast.success(isEdit ? 'Course updated!' : 'Course created!');
      isEdit ? resetEditForm() : resetForm();
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error('Error saving course');
    }
  };


  // ────────────────────────────────────────────────────────────────────────────
  // Fetch, Delete, Reset
  // ────────────────────────────────────────────────────────────────────────────
  const fetchCourses = async () => {
    try {
      setLoading(true);
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const xsrfToken = getCookie('XSRF-TOKEN');
      const res = await fetch(`${API_URL}/api/courses`, { credentials: 'include', headers: { 'X-XSRF-TOKEN': xsrfToken } });
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      const xsrfToken = getCookie('XSRF-TOKEN');
      const res = await fetch(`${API_URL}/api/courses/${id}`, { method: 'DELETE', credentials: 'include', headers: { 'X-XSRF-TOKEN': xsrfToken } });
      if (!res.ok) return toast.error('Failed to delete course');
      toast.success('Course deleted');
      fetchCourses();
    } catch {
      toast.error('Error deleting course');
    }
  };


  const resetForm = () => setForm(emptyForm());
  const resetEditForm = () => { setEditForm(emptyForm()); setSelectedEditId(''); };


  useEffect(() => { fetchCourses(); }, []);


    return (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
        <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Back to Admin
        </Link>
      </div>


      {/* Add and Edit Forms Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Add New Course */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">Add New Course</h2>
          {/* Existing create course form */}
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" name="title" value={form.title} onChange={(e) => handleChange(e, false)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input type="number" name="price" value={form.price} onChange={(e) => handleChange(e, false)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={(e) => handleChange(e, false)} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
              <div className="flex items-center space-x-4">
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, false)} disabled={uploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {form.thumbnail_url && (
                  <button type="button" onClick={() => handleRemoveThumbnail(false)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Remove</button>
                )}
              </div>
              {form.thumbnail_url && <img src={form.thumbnail_url} alt="Thumbnail" className="mt-2 w-32 h-32 object-cover rounded" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chapters</label>
              {form.chapters.map((chapter, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <input type="text" placeholder="Chapter Title" value={chapter.title} onChange={(e) => handleChapterField(index, 'title', e.target.value, false)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <input type="text" placeholder="Drive Folder ID" value={chapter.drive_folder_id} onChange={(e) => handleChapterField(index, 'drive_folder_id', e.target.value, false)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={() => handleRestrictAndPreventDownload(index, chapter.drive_folder_id, false)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
                      {chapter.isRestricted ? 'Restricted' : 'Restrict Download'}
                    </button>
                    <button type="button" onClick={() => removeChapter(index, false)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addChapter(false)} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add Chapter</button>
            </div>
            <div className="text-right">
              <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Create Course</button>
            </div>
          </form>
        </div>


        {/* Edit Course */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Edit Course</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course to Edit</label>
            <select value={selectedEditId} onChange={handleEditSelect} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
              <option value="">-- Select Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          {selectedEditId && (
            <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" name="title" value={editForm.title} onChange={(e) => handleChange(e, true)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input type="number" name="price" value={editForm.price} onChange={(e) => handleChange(e, true)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={editForm.description} onChange={(e) => handleChange(e, true)} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                <div className="flex items-center space-x-4">
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, true)} disabled={uploading} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
                  {editForm.thumbnail_url && (
                    <button type="button" onClick={() => handleRemoveThumbnail(true)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Remove</button>
                  )}
                </div>
                {editForm.thumbnail_url && <img src={editForm.thumbnail_url} alt="Thumbnail" className="mt-2 w-32 h-32 object-cover rounded" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chapters</label>
                {editForm.chapters.map((chapter, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <input type="text" placeholder="Chapter Title" value={chapter.title} onChange={(e) => handleChapterField(index, 'title', e.target.value, true)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                      <input type="text" placeholder="Drive Folder ID" value={chapter.drive_folder_id} onChange={(e) => handleChapterField(index, 'drive_folder_id', e.target.value, true)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button type="button" onClick={() => handleRestrictAndPreventDownload(index, chapter.drive_folder_id, true)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">{chapter.isRestricted ? 'Restricted' : 'Restrict Download'}</button>
                      <button type="button" onClick={() => removeChapter(index, true)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Remove</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addChapter(true)} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add Chapter</button>
              </div>
              <div className="flex space-x-4">
                <button type="submit" className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">Update Course</button>
                <button type="button" onClick={resetEditForm} className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Cancel Edit</button>
              </div>
            </form>
          )}
        </div>
      </div>


      {/* Courses List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Courses</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No courses found. Create your first course above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {course.thumbnail_url && (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-2">{course.description}</p>
                <p className="text-blue-600 font-bold mb-4">${course.price}</p>
                <div className="flex space-x-2">
                  <button onClick={() => handleEditSelect({ target: { value: course.id } })} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm">Edit</button>
                  <button onClick={() => handleDelete(course.id)} className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);


}