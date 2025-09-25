'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import QuizBuilder to avoid SSR issues
const QuizBuilder = dynamic(() => import('../../../../../components/admin/QuizBuilder'), {
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

export default function EditQuizPage() {
    const params = useParams();
    const quizId = params?.id;

    if (!quizId) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-6xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="text-red-600 text-xl mb-4">❌ Error</div>
                        <p className="text-gray-600 mb-4">Quiz ID not found</p>
                        <Link 
                            href="/admin/quizzes"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Back to Quizzes
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                        <span className="text-gray-600 font-medium">Edit Quiz</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <QuizBuilder quizId={quizId} />
        </div>
    );
}
