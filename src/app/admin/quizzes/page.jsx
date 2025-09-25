'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import QuizList from '../../../components/admin/QuizList';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { apiRequest } from '../../../utils/auth';

export default function AdminQuizzesPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        activeQuizzes: 0,
        totalAttempts: 0,
        avgScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await apiRequest('/api/admin/quizzes');
            
            if (!response.ok) {
                throw new Error('Failed to load quiz stats');
            }

            const result = await response.json();
            const quizzes = result.data?.data || [];
            
            // Calculate stats from quiz data
            const totalQuizzes = quizzes.length;
            const activeQuizzes = quizzes.filter(q => q.is_active).length;
            const totalAttempts = quizzes.reduce((sum, q) => sum + (q.attempts_count || 0), 0);
            
            // You can enhance this further with more detailed API calls if needed
            setStats({
                totalQuizzes,
                activeQuizzes,
                totalAttempts,
                avgScore: 0 // Will need separate API call for this
            });
        } catch (error) {
            console.error('Error loading stats:', error);
            toast.error('Failed to load quiz statistics');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation Breadcrumb */}
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
                        <span className="text-gray-600 font-medium">Quiz Management</span>
                    </nav>
                </div>
            </div>

            {/* Page Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Quiz Management</h1>
                            <p className="text-blue-100">
                                Create, edit, and manage quizzes for your students
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => router.push('/admin/quizzes/quiz-builder')}
                                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium flex items-center space-x-2 shadow-md"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Create New Quiz</span>
                            </button>
                            <Link
                                href="/admin/quiz-analytics"
                                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-400 font-medium flex items-center space-x-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span>Analytics</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="max-w-7xl mx-auto px-4 -mt-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {loading ? <LoadingSpinner size="small" /> : stats.totalQuizzes}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Quizzes</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {loading ? <LoadingSpinner size="small" /> : stats.activeQuizzes}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {loading ? <LoadingSpinner size="small" /> : stats.totalAttempts}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {loading ? <LoadingSpinner size="small" /> : (stats.avgScore ? `${stats.avgScore}%` : 'N/A')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Quiz List */}
            <div className="pb-8">
                <QuizList onStatsUpdate={loadStats} />
            </div>

            {/* Quick Actions Sidebar */}
            <div className="fixed bottom-6 right-6 space-y-3">
                <button
                    onClick={() => router.push('/admin/quizzes/quiz-builder')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
                    title="Create New Quiz"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
