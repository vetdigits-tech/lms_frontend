'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';

// Dynamically import QuizBuilder to avoid SSR issues
const QuizBuilder = dynamic(() => import('../../../../components/admin/QuizBuilder'), {
    ssr: false,
    loading: () => (
        <div className="max-w-6xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Quiz Builder...</p>
            </div>
        </div>
    )
});

export default function CreateQuizPage() {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Breadcrumb */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Link 
                            href="/admin" 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Admin Dashboard
                        </Link>
                        <span className="text-gray-400">/</span>
                        <Link 
                            href="/admin/quizzes" 
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Quiz Management
                        </Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600 font-medium">Create New Quiz</span>
                    </nav>
                </div>
            </div>

            <QuizBuilder />
        </div>
    );
}
