'use client';
import React, { useState } from 'react';
import { apiRequest } from '../../utils/auth';

const ImageUploader = ({ onUpload, size = 'normal', existingImage = null }) => {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
            return;
        }

        // Validate file size (3MB max)
        if (file.size > 3 * 1024 * 1024) {
            alert('File size must be less than 3MB');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiRequest('/api/admin/upload/image', {
                method: 'POST',
                body: formData,
                formData: true // This tells our helper not to set Content-Type
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            if (result.url) {
                onUpload(result.url);
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const sizeClasses = {
        small: 'h-20 text-xs',
        normal: 'h-32 text-sm',
        large: 'h-48 text-base'
    };

    if (existingImage) {
        return (
            <div className="relative inline-block">
                <img 
                    src={existingImage} 
                    alt="Uploaded" 
                    className={`${size === 'small' ? 'max-w-32' : 'max-w-xs'} rounded-lg border`}
                />
                <button
                    type="button"
                    onClick={() => onUpload('')}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                >
                    ×
                </button>
            </div>
        );
    }

    return (
        <div className={`relative ${sizeClasses[size]}`}>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id={`file-input-${Math.random()}`}
                disabled={uploading}
            />
            
            <label
                htmlFor={`file-input-${Math.random()}`}
                className={`
                    flex flex-col items-center justify-center w-full h-full
                    border-2 border-dashed rounded-lg cursor-pointer
                    transition-colors duration-200
                    ${dragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }
                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <div className="flex flex-col items-center justify-center text-center p-2">
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                            <p className="text-gray-600">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <svg
                                className={`mb-2 text-gray-400 ${size === 'small' ? 'w-4 h-4' : 'w-8 h-8'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <p className="text-gray-600">
                                <span className="font-semibold">Click to upload</span>
                                {size !== 'small' && <span> or drag and drop</span>}
                            </p>
                            {size !== 'small' && (
                                <p className="text-gray-500 text-xs mt-1">
                                    PNG, JPG, GIF up to 3MB
                                </p>
                            )}
                        </>
                    )}
                </div>
            </label>
        </div>
    );
};

export default ImageUploader;
