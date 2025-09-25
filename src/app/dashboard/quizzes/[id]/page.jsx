'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const QuizTaker = dynamic(() => import('../../../../components/quiz/QuizTaker'), {
    ssr: false,
    loading: () => (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-4xl mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Quiz</h2>
                <p className="text-gray-600">Please wait while we prepare your quiz...</p>
            </div>
        </div>
    )
});

export default function QuizTakingPage() {
    const params = useParams();
    const quizId = params?.id;

    if (!quizId) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto">
                    <div className="text-red-600 text-xl mb-4">❌</div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
                    <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist.</p>
                    <a 
                        href="/dashboard/quizzes"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
                    >
                        Back to Quizzes
                    </a>
                </div>
            </div>
        );
    }

    return <QuizTaker quizId={quizId} />;
}
