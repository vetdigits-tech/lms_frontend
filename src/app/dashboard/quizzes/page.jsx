'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { apiRequest } from '../../../utils/auth'; // Using your existing auth utils

// Dynamically import QuizCard to avoid SSR issues
const QuizCard = dynamic(() => import('../../../components/quiz/QuizCard'), {
    ssr: false,
    loading: () => (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 animate-pulse">
            <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
            </div>
        </div>
    )
});

export default function StudentQuizzesPage() {
    const [quizzes, setQuizzes] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [quizzesLoaded, setQuizzesLoaded] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadQuizzesAndStats();
    }, []);

    const loadQuizzesAndStats = async () => {
        setLoading(true);
        setStatsLoading(true);
        setError(null);
        setQuizzesLoaded(false);
        
        try {
            // Load quizzes using your existing apiRequest function
            console.log('Loading quizzes...');
            const quizzesResponse = await apiRequest('/api/quizzes');
            
            if (!quizzesResponse.ok) {
                if (quizzesResponse.status === 404) {
                    // No quizzes available, but not an error
                    console.log('No quizzes found (404)');
                    setQuizzes([]);
                    setQuizzesLoaded(true);
                } else if (quizzesResponse.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                } else {
                    const errorText = await quizzesResponse.text();
                    console.error('Quiz loading error:', errorText);
                    throw new Error(`Failed to load quizzes (${quizzesResponse.status})`);
                }
            } else {
                const quizzesResult = await quizzesResponse.json();
                console.log('Quizzes loaded successfully:', quizzesResult);
                
                // Handle different response structures from your API
                const quizData = quizzesResult.data || quizzesResult || [];
                setQuizzes(Array.isArray(quizData) ? quizData : []);
                setQuizzesLoaded(true);
                console.log('Quiz data set:', Array.isArray(quizData) ? quizData.length : 0, 'items');
            }
            
            setLoading(false);
            
            // Load stats using your existing API patterns
            await loadUserStatsWithFallback();
            
        } catch (err) {
            console.error('Error loading quizzes:', err);
            
            // Handle different error types
            if (err.message.includes('Authentication failed')) {
                setError('Please log in to view quizzes.');
                toast.error('Please log in again');
            } else if (!quizzesLoaded) {
                setError('Failed to load quizzes. Please try again.');
                toast.error('Failed to load quizzes');
            }
        } finally {
            setLoading(false);
            setStatsLoading(false);
        }
    };

    const loadUserStatsWithFallback = async () => {
        const strategies = [
            {
                name: 'Primary Stats API',
                endpoint: '/api/user/quiz-stats',
                transform: (data) => data
            },
            {
                name: 'Leaderboard Performance API', 
                endpoint: '/api/leaderboard/my-global-performance',
                transform: (data) => ({
                    user: data.user,
                    stats: {
                        completed_quizzes: data.summary?.total_quizzes_taken || 0,
                        average_score: data.summary?.average_score || null,
                        best_score: data.summary?.best_score || null,
                        total_quiz_time: null,
                        podium_finishes: data.summary?.podium_finishes || 0
                    },
                    recent_activity: data.quiz_performances?.map(perf => ({
                        quiz_title: perf.quiz_title,
                        score: perf.score_percentage,
                        status: 'Completed',
                        violations: 0,
                        started_at: perf.completed_at
                    })) || []
                })
            }
        ];

        for (const strategy of strategies) {
            try {
                console.log(`Trying ${strategy.name}:`, strategy.endpoint);
                // Use your existing apiRequest function for all API calls
                const response = await apiRequest(strategy.endpoint);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(`${strategy.name} response:`, result);
                    
                    if (result.success && result.data) {
                        const transformedData = strategy.transform(result.data);
                        setUserStats(transformedData);
                        console.log(`✅ ${strategy.name} succeeded`);
                        return; // Success, exit the loop
                    }
                } else {
                    const errorText = await response.text();
                    console.warn(`${strategy.name} failed:`, response.status, errorText);
                }
            } catch (err) {
                console.warn(`${strategy.name} error:`, err.message);
            }
        }

        // If all strategies fail, set default stats
        console.log('All stats strategies failed, using defaults');
        setUserStats({
            stats: {
                completed_quizzes: 0,
                average_score: null,
                best_score: null,
                total_quiz_time: null,
                podium_finishes: 0
            },
            recent_activity: []
        });
    };

    const filteredQuizzes = quizzes.filter(quiz => {
        const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            quiz.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        switch (filterStatus) {
            case 'completed':
                return quiz.best_score >= quiz.passing_score_percentage;
            case 'incomplete':
                return quiz.user_attempts === 0 || quiz.best_score < quiz.passing_score_percentage;
            default:
                return true;
        }
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatStatValue = (value, type = 'number', suffix = '') => {
        if (value === null || value === undefined || isNaN(value)) {
            return 'N/A';
        }
        
        if (type === 'time') {
            const absValue = Math.abs(value);
            if (absValue === 0) return 'N/A';
            return `${absValue}${suffix}`;
        }
        
        if (type === 'percentage') {
            return `${Math.round(value)}%`;
        }
        
        return `${value}${suffix}`;
    };

    // Don't render until mounted to prevent hydration issues
    if (!mounted) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-8 w-2/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-gray-600">Loading your quizzes...</p>
                </div>
            </div>
        );
    }

    // Only show error if there's an actual error AND quizzes weren't loaded successfully
    if (error && !quizzesLoaded) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-red-600 text-xl mb-4">❌ Error</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={loadQuizzesAndStats}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                        {error.includes('log in') && (
                            <button 
                                onClick={() => window.location.href = '/login'}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                            >
                                Go to Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {getGreeting()}! Ready to test your knowledge? 🧠
                </h1>
                <p className="text-gray-600">
                    Challenge yourself with our interactive quizzes and track your progress
                </p>
            </div>

            {/* User Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Quizzes Completed</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
                                ) : (
                                    userStats?.stats?.completed_quizzes || 0
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Average Score</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                ) : (
                                    formatStatValue(userStats?.stats?.average_score, 'percentage')
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Best Score</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                ) : (
                                    formatStatValue(userStats?.stats?.best_score, 'percentage')
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                {userStats?.stats?.podium_finishes ? 'Podium Finishes' : 'Time Spent'}
                            </p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {statsLoading ? (
                                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                ) : userStats?.stats?.podium_finishes ? (
                                    `${userStats.stats.podium_finishes} 🏆`
                                ) : (
                                    formatStatValue(userStats?.stats?.total_quiz_time, 'time', 'm')
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Controls - Only show if we have quizzes loaded successfully */}
            {quizzesLoaded && quizzes.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search quizzes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Filter */}
                        <div className="flex space-x-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Quizzes</option>
                                <option value="incomplete">Not Completed</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Results count */}
                        <div className="text-sm text-gray-600">
                            {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'es' : ''} found
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Content */}
            {quizzesLoaded && (quizzes.length === 0 || filteredQuizzes.length === 0) ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <div className="mb-6">
                        <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-3">
                        {quizzes.length === 0 
                            ? 'No quizzes available' 
                            : 'No quizzes match your search'
                        }
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {quizzes.length === 0
                            ? 'There are currently no quizzes available. Check back later for new quizzes to test your knowledge!'
                            : 'Try adjusting your search terms or filters to find the quizzes you\'re looking for.'
                        }
                    </p>
                    {quizzes.length > 0 && (searchTerm || filterStatus !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('all');
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : quizzesLoaded && filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuizzes.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                </div>
            ) : null}

            {/* Recent Activity */}
            {userStats && userStats.recent_activity && userStats.recent_activity.length > 0 && (
                <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Recent Quiz Activity
                    </h3>
                    <div className="space-y-3">
                        {userStats.recent_activity.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">{activity.quiz_title}</div>
                                    <div className="text-sm text-gray-600">
                                        {activity.score !== null ? `Score: ${Math.round(activity.score)}%` : 'In Progress'} • 
                                        Status: {activity.status}
                                        {activity.violations > 0 && (
                                            <span className="ml-2 text-red-600">({activity.violations} violations)</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {activity.started_at ? new Date(activity.started_at).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            
        </div>
    );
}
