"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ------------------------------- Helpers ------------------------------- */
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

const authFetch = async (url, options = {}) => {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" });

  const xsrf = getCookie("XSRF-TOKEN");
  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
    "X-XSRF-TOKEN": xsrf || "",
  };

  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
};

// ✅ Helper function to extract Google Drive folder ID from URL
const extractFolderId = (url) => {
  if (!url) return '';
  
  // If it's already just an ID (no URL), return as-is
  if (!url.includes('drive.google.com')) {
    return url;
  }
  
  // Extract folder ID from full URL
  const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url;
};

// ✅ Helper function to convert folder ID back to full URL
const convertToFullUrl = (folderId) => {
  if (!folderId) return '';
  
  // If it's already a full URL, return as-is
  if (folderId.includes('drive.google.com')) {
    return folderId;
  }
  
  // Convert folder ID back to full URL for editing
  return `https://drive.google.com/drive/folders/${folderId}`;
};

const emptySubject = () => ({
  name: "",
  description: "",
  price: "",
  thumbnail_url: "",
  drive_folder_id: "",
  chapters: [{ title: "", pdf_url: "" }],
});

/* ------------------------------ Component ------------------------------ */
export default function ManageNotesPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptySubject());
  const [editForm, setEditForm] = useState(emptySubject());
  const [selectedEditId, setSelectedEditId] = useState("");

  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingCreate, setSyncingCreate] = useState(false);

  /* ------------------------------- Fetching ------------------------------ */
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/notes/subjects`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  /* ------------------------- Field Handlers ------------------------- */
  // ✅ KEEP FULL URL: Don't extract folder ID in onChange
  const handleField = (e, isEdit = false) => {
    const { name, value } = e.target;
    (isEdit ? setEditForm : setForm)((prev) => ({ ...prev, [name]: value }));
  };

  const handleChapterField = (index, field, value, isEdit = false) => {
    const updater = isEdit ? setEditForm : setForm;
    updater((prev) => {
      const chapters = [...prev.chapters];
      chapters[index] = { ...chapters[index], [field]: value };
      return { ...prev, chapters };
    });
  };

  const addChapter = (isEdit = false) => {
    const updater = isEdit ? setEditForm : setForm;
    updater((prev) => ({
      ...prev,
      chapters: [...prev.chapters, { title: "", pdf_url: "" }],
    }));
  };

  const removeChapter = (index, isEdit = false) => {
    const updater = isEdit ? setEditForm : setForm;
    updater((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index),
    }));
  };

  /* ----------------------------- Sync Drive for Create Form ----------------------------- */
  const handleSyncDriveCreate = async () => {
    if (!form.drive_folder_id) {
      toast.error("Please enter a Google Drive folder URL first");
      return;
    }

    setSyncingCreate(true);
    try {
      // ✅ Use FULL URL for sync endpoint
      const res = await authFetch(`${API_URL}/api/sync-drive-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drive_folder_id: form.drive_folder_id }), // Full URL
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to sync with Drive");
      }

      const data = await res.json();
      toast.success("PDFs synced from Google Drive!");

      const syncedChapters =
        data.chapters?.map((ch) => ({
          title: ch.name || ch.title || "",
          pdf_url: ch.pdf_url || "",
        })) || [];

      setForm((prev) => ({
        ...prev,
        chapters: syncedChapters.length > 0 ? syncedChapters : [{ title: "", pdf_url: "" }],
      }));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncingCreate(false);
    }
  };

  /* ----------------------------- Sync Drive for Edit Form ----------------------------- */
  const handleSyncDrive = async () => {
    if (!selectedEditId) {
      toast.error("Select a subject to sync");
      return;
    }
    setSyncing(true);
    try {
      const res = await authFetch(
        `${API_URL}/api/note-subjects/${selectedEditId}/sync-drive`,
        { method: "GET" }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to sync with Drive");
      }
      const data = await res.json();

      toast.success("Chapters synced with Google Drive!");

      const chapters =
        data.subject?.chapters?.map((ch) => ({
          id: ch.id ?? null,
          title: ch.name ?? "",
          pdf_url: ch.pdf_url ?? "",
        })) ?? [];

      setEditForm((prev) => ({ ...prev, chapters: chapters.length ? chapters : [{ title: "", pdf_url: "" }] }));

      fetchSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  /* ----------------------------- File Upload ----------------------------- */
  const handleFileUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await authFetch(`${API_URL}/api/upload-thumbnail`, {
        method: "POST",
        body: data,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Upload failed");
      }
      const { url } = await res.json();

      (isEdit ? setEditForm : setForm)((prev) => ({
        ...prev,
        thumbnail_url: url,
      }));
      toast.success("Thumbnail uploaded!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveThumbnail = async (isEdit = false) => {
    const state = isEdit ? editForm : form;
    if (!state.thumbnail_url) return;
    setUploading(true);
    try {
      const res = await authFetch(`${API_URL}/api/delete-thumbnail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.thumbnail_url }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to remove thumbnail");
      }

      (isEdit ? setEditForm : setForm)((prev) => ({
        ...prev,
        thumbnail_url: "",
      }));
      toast.success("Thumbnail removed!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to remove thumbnail.");
    } finally {
      setUploading(false);
    }
  };

  /* ----------------------------- Create Subject ----------------------------- */
  const handleCreate = async (e) => {
    e.preventDefault();
    
    // ✅ Extract folder ID ONLY when submitting to database
    const folderId = extractFolderId(form.drive_folder_id);
    console.log('Creating subject with extracted folder ID:', folderId);
    
    try {
      const payload = {
        name: form.name,
        description: form.description || "",
        price: form.price === "" ? null : Number(form.price),
        thumbnail_url: form.thumbnail_url || "",
        drive_folder_id: folderId, // ✅ Use extracted folder ID for database
        chapters: form.chapters.map((c) => ({
          title: c.title || "",
          pdf_url: c.pdf_url || "",
        })),
      };

      const res = await authFetch(`${API_URL}/api/notes/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to create subject");
      }

      toast.success("Subject created!");
      setForm(emptySubject());
      fetchSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error creating subject");
    }
  };

  /* ----------------------------- Edit Subject ----------------------------- */
  // ✅ UPDATED: Convert folder ID back to full URL for editing
  const handleEditSelect = (e) => {
    const id = e.target.value;
    setSelectedEditId(id);
    const subj = subjects.find((s) => String(s.id) === String(id));
    if (!subj) {
      setEditForm(emptySubject());
      return;
    }

    setEditForm({
      name: subj.name || "",
      description: subj.description || "",
      price: subj.price ?? "",
      thumbnail_url: subj.thumbnail_url || "",
      drive_folder_id: convertToFullUrl(subj.drive_folder_id), // ✅ Convert to full URL
      chapters:
        Array.isArray(subj.chapters) && subj.chapters.length > 0
          ? subj.chapters.map((ch) => ({
              id: ch.id ?? null,
              title: ch.name ?? "",
              pdf_url: ch.pdf_url ?? "",
            }))
          : [{ title: "", pdf_url: "" }],
    });

    window?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEditId) return;

    // ✅ Extract folder ID ONLY when submitting to database
    const folderId = extractFolderId(editForm.drive_folder_id);
    console.log('Updating subject with extracted folder ID:', folderId);

    try {
      const payload = {
        name: editForm.name,
        description: editForm.description || "",
        price: editForm.price === "" ? null : Number(editForm.price),
        thumbnail_url: editForm.thumbnail_url || "",
        drive_folder_id: folderId, // ✅ Use extracted folder ID for database
        chapters: editForm.chapters.map((c) => ({
          id: c.id ?? null,
          title: c.title || "",
          pdf_url: c.pdf_url || "",
        })),
      };

      const res = await authFetch(
        `${API_URL}/api/notes/subjects/${selectedEditId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update subject");
      }

      toast.success("Subject updated!");
      setSelectedEditId("");
      setEditForm(emptySubject());
      fetchSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error updating subject");
    }
  };

  /* ----------------------------- Delete Subject ----------------------------- */
  const handleDelete = async (id) => {
    if (!confirm("Delete this subject?")) return;
    try {
      const res = await authFetch(`${API_URL}/api/notes/subjects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to delete subject");
      }
      toast.success("Subject deleted");
      fetchSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error deleting subject");
    }
  };

  const resetEditForm = () => {
    setSelectedEditId("");
    setEditForm(emptySubject());
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Notes</h1>
          <Link
            href="/admin"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Admin
          </Link>
        </div>

        {/* Add + Edit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Subject */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">
              Add New Subject
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={(e) => handleField(e, false)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleField(e, false)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={form.price}
                  onChange={(e) => handleField(e, false)}
                  placeholder="Enter price (e.g., 199.00)"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Drive Folder URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    name="drive_folder_id"
                    value={form.drive_folder_id}
                    onChange={(e) => handleField(e, false)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleSyncDriveCreate}
                    disabled={syncingCreate || !form.drive_folder_id}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {syncingCreate ? "Syncing..." : "🔄 Sync"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Paste your Google Drive folder URL. Folder ID will be auto-extracted when saving.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {form.thumbnail_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveThumbnail(false)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {form.thumbnail_url && (
                  <img
                    src={form.thumbnail_url}
                    alt="Thumbnail"
                    className="mt-2 w-32 h-32 object-cover rounded"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapters {syncingCreate && <span className="text-purple-600">(Syncing from Drive...)</span>}
                </label>

                {form.chapters.map((chapter, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-md p-4 mb-3">
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Chapter Name"
                        value={chapter.title}
                        onChange={(e) =>
                          handleChapterField(idx, "title", e.target.value, false)
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="url"
                        placeholder="PDF URL (optional)"
                        value={chapter.pdf_url}
                        onChange={(e) =>
                          handleChapterField(idx, "pdf_url", e.target.value, false)
                        }
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {chapter.pdf_url && (
                      <a
                        href={chapter.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline text-sm mt-2 inline-block"
                      >
                        View PDF
                      </a>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => removeChapter(idx, false)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addChapter(false)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  + Add Chapter
                </button>
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>

          {/* Edit Subject */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">
              Edit Subject
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Subject to Edit
              </label>
              <select
                value={selectedEditId}
                onChange={handleEditSelect}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEditId && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={(e) => handleField(e, true)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => handleField(e, true)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={editForm.price}
                    onChange={(e) => handleField(e, true)}
                    placeholder="Enter price (e.g., 199.00)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {/* ✅ FIXED: Google Drive field - Optional and accepts both URL formats */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Drive Folder URL (Optional)
                  </label>
                  <input
                    type="text"  // ✅ Changed from "url" to "text" to avoid HTML validation
                    name="drive_folder_id"
                    value={editForm.drive_folder_id}
                    onChange={(e) => handleField(e, true)}
                    placeholder="https://drive.google.com/drive/folders/... (optional)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    // ✅ No "required" attribute
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Paste your Google Drive folder URL. Folder ID will be auto-extracted when saving.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                    />
                    {editForm.thumbnail_url && (
                      <button
                        type="button"
                        onClick={() => handleRemoveThumbnail(true)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {editForm.thumbnail_url && (
                    <img
                      src={editForm.thumbnail_url}
                      alt="Thumbnail"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleSyncDrive}
                    disabled={syncing}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                  >
                    {syncing ? "Syncing..." : "🔄 Sync with Google Drive"}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapters
                  </label>

                  {editForm.chapters.map((chapter, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-md p-4 mb-3">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Chapter Name"
                          value={chapter.title}
                          onChange={(e) =>
                            handleChapterField(idx, "title", e.target.value, true)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="url"
                          placeholder="PDF URL (optional)"
                          value={chapter.pdf_url}
                          onChange={(e) =>
                            handleChapterField(idx, "pdf_url", e.target.value, true)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      </div>

                      {chapter.pdf_url && (
                        <a
                          href={chapter.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm mt-2 inline-block"
                        >
                          View PDF
                        </a>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => removeChapter(idx, true)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addChapter(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    + Add Chapter
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  >
                    Update Subject
                  </button>
                  <button
                    type="button"
                    onClick={resetEditForm}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel Edit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Subjects List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">All Subjects</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading subjects...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No subjects found. Create your first subject above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {s.thumbnail_url && (
                    <img
                      src={s.thumbnail_url}
                      alt={s.name}
                      className="w-full h-44 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-1">{s.name}</h3>
                  <p className="text-gray-600 mb-2">{s.description}</p>

                  {s.price !== undefined && s.price !== null && (
                    <p className="text-sm font-medium text-gray-800 mb-2">Price: ₹{s.price}</p>
                  )}

                  {Array.isArray(s.chapters) && s.chapters.length > 0 && (
                    <div className="text-sm text-gray-700 mb-3">
                      <p className="font-medium mb-1">Chapters ({s.chapters.length})</p>
                      <ul className="list-disc ml-5 space-y-1">
                        {s.chapters.slice(0, 4).map((c) => (
                          <li key={c.id || c.title}>
                            {c.name || c.title} —{" "}
                            <a
                              className="text-blue-600 underline"
                              href={c.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              PDF
                            </a>
                          </li>
                        ))}
                        {s.chapters.length > 4 && <li>…and more</li>}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSelect({ target: { value: s.id } })}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
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
