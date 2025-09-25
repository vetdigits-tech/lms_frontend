'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { apiRequest } from '../../../../utils/auth';

const Leaderboard = () => {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuiz, setSelectedQuiz] = useState('all');
    const [quizzes, setQuizzes] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedQuiz) {
            loadLeaderboard();
        }
    }, [selectedQuiz]);

    const loadInitialData = async () => {
        await Promise.all([
            loadQuizzes(),
            loadLeaderboard()
        ]);
    };

    const loadQuizzes = async () => {
        try {
            const response = await apiRequest('/api/quizzes');
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load quizzes:', err);
        }
    };

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            setError(null);
            
            let endpoint, statsEndpoint;
            
            if (selectedQuiz === 'all') {
                endpoint = '/api/leaderboard/global';
                statsEndpoint = '/api/admin/leaderboard/system-stats';
            } else {
                endpoint = `/api/leaderboard/quiz/${selectedQuiz}`;
                statsEndpoint = `/api/leaderboard/quiz/${selectedQuiz}/stats`;
            }
            
            console.log('Loading leaderboard from:', endpoint);
            
            const response = await apiRequest(endpoint);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Leaderboard response:', data);
                setLeaderboard(data.data || []);
                
                // Try to load stats (optional, might fail for some endpoints)
                try {
                    const statsResponse = await apiRequest(statsEndpoint);
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        setStats(statsData.data);
                    }
                } catch (statsErr) {
                    console.log('Stats not available:', statsErr.message);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load leaderboard');
            }
        } catch (err) {
            console.error('Leaderboard error:', err);
            setError(err.message);
            toast.error('Failed to load leaderboard: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0) return '0m 0s';
        const totalSeconds = Math.abs(Math.floor(seconds));
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getRankDisplay = (rank, rankDisplay) => {
        if (rankDisplay) return rankDisplay;
        
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getBadgeEmoji = (badge) => {
        const badges = {
            'legendary': '👑',
            'excellent': '🌟',
            'great': '🔥',
            'good': '👍',
            'average': '⭐',
            'needs_improvement': '📚'
        };
        return badges[badge] || '⭐';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-gray-600">Loading Leaderboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div className="flex items-center mb-4 md:mb-0">
                            <span className="text-4xl mr-4">🏆</span>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {selectedQuiz === 'all' ? 'Global Quiz Leaderboard' : 'Quiz Leaderboard'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {selectedQuiz === 'all' 
                                        ? 'Top performers across all quizzes' 
                                        : `Top performers for ${quizzes.find(q => q.id == selectedQuiz)?.title || 'Selected Quiz'}`
                                    }
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.push('/dashboard/quizzes')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Quizzes
                        </button>
                    </div>

                    {/* Quiz Filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Quiz:
                            </label>
                            <select 
                                value={selectedQuiz}
                                onChange={(e) => setSelectedQuiz(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Quizzes (Global Leaderboard)</option>
                                {quizzes.map(quiz => (
                                    <option key={quiz.id} value={quiz.id}>
                                        {quiz.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={loadLeaderboard}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                disabled={loading}
                            >
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="text-2xl font-bold text-blue-600">
                                    {stats.total_active_users || leaderboard.length}
                                </div>
                                <div className="text-sm text-blue-700">Active Users</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.total_completions || leaderboard.length}
                                </div>
                                <div className="text-sm text-green-700">Total Attempts</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.round(stats.global_average_score || 0)}%
                                </div>
                                <div className="text-sm text-purple-700">Average Score</div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {Math.round(stats.highest_score_ever || 0)}%
                                </div>
                                <div className="text-sm text-yellow-700">Highest Score</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Leaderboard Content */}
                {error ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="text-red-600 text-6xl mb-4">❌</div>
                        <h2 className="text-xl font-semibold mb-4">Failed to Load Leaderboard</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={loadLeaderboard}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={() => router.push('/dashboard/quizzes')}
                                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                            >
                                Back to Quizzes
                            </button>
                        </div>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="text-gray-400 text-6xl mb-4">📊</div>
                        <h2 className="text-xl font-semibold mb-4">No Leaderboard Data</h2>
                        <p className="text-gray-600 mb-6">
                            {selectedQuiz === 'all' 
                                ? 'No quiz attempts found yet. Be the first to take a quiz!' 
                                : 'No attempts found for this quiz yet. Be the first to take it!'
                            }
                        </p>
                        <button 
                            onClick={() => router.push('/dashboard/quizzes')}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                        >
                            Take a Quiz
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Mobile-friendly table */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full">
                                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                    <tr>
                                        <th className="px-3 md:px-6 py-4 text-left text-xs md:text-sm font-semibold uppercase tracking-wider">
                                            Rank
                                        </th>
                                        <th className="px-3 md:px-6 py-4 text-left text-xs md:text-sm font-semibold uppercase tracking-wider">
                                            User
                                        </th>
                                        {selectedQuiz === 'all' && (
                                            <th className="px-3 md:px-6 py-4 text-left text-xs md:text-sm font-semibold uppercase tracking-wider hidden md:table-cell">
                                                Quiz
                                            </th>
                                        )}
                                        <th className="px-3 md:px-6 py-4 text-center text-xs md:text-sm font-semibold uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th className="px-3 md:px-6 py-4 text-center text-xs md:text-sm font-semibold uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="px-3 md:px-6 py-4 text-center text-xs md:text-sm font-semibold uppercase tracking-wider hidden md:table-cell">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leaderboard.map((entry, index) => (
                                        <tr key={entry.id || index} className={`hover:bg-gray-50 transition-colors ${
                                            entry.is_podium_finish || entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                                        }`}>
                                            {/* Rank */}
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`text-lg md:text-2xl font-bold ${
                                                        entry.rank === 1 ? 'text-yellow-500' :
                                                        entry.rank === 2 ? 'text-gray-400' :
                                                        entry.rank === 3 ? 'text-orange-600' :
                                                        'text-gray-600'
                                                    }`}>
                                                        {getRankDisplay(entry.rank, entry.rank_display)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* User */}
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm mr-2 md:mr-3">
                                                        {(entry.user_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-900 text-sm md:text-base truncate">
                                                            {entry.user_name || 'Anonymous'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {entry.user_email || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Quiz (only show in global view on desktop) */}
                                            {selectedQuiz === 'all' && (
                                                <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                                                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                        {entry.quiz_title || 'Unknown Quiz'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {entry.total_questions || 0} questions
                                                    </div>
                                                </td>
                                            )}

                                            {/* Score */}
                                            <td className="px-3 md:px-6 py-4 text-center">
                                                <div className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                                                    (entry.percentage || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                                    (entry.percentage || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {Math.round(entry.percentage || 0)}%
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {entry.correct_answers || 0}/{entry.total_questions || 0}
                                                </div>
                                                {entry.badge_display_text && (
                                                    <div className="text-xs text-blue-600 mt-1 flex items-center justify-center">
                                                        <span className="mr-1">{getBadgeEmoji(entry.performance_badge)}</span>
                                                        <span className="hidden md:inline">{entry.badge_display_text}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Time */}
                                            <td className="px-3 md:px-6 py-4 text-center">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {entry.formatted_time || formatTime(entry.time_taken_seconds)}
                                                </div>
                                                {entry.percentile && (
                                                    <div className="text-xs text-gray-500 hidden md:block">
                                                        {entry.percentile}th percentile
                                                    </div>
                                                )}
                                            </td>

                                            {/* Date (hidden on mobile) */}
                                            <td className="px-3 md:px-6 py-4 text-center hidden md:table-cell">
                                                <div className="text-sm text-gray-900">
                                                    {entry.completed_at 
                                                        ? new Date(entry.completed_at).toLocaleDateString() 
                                                        : entry.created_at 
                                                        ? new Date(entry.created_at).toLocaleDateString()
                                                        : 'N/A'
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {entry.completed_at 
                                                        ? new Date(entry.completed_at).toLocaleTimeString() 
                                                        : entry.created_at 
                                                        ? new Date(entry.created_at).toLocaleTimeString()
                                                        : ''
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 md:px-6 py-4 text-center">
                            <p className="text-sm text-gray-500">
                                Showing {leaderboard.length} {leaderboard.length === 1 ? 'performer' : 'performers'} • Updated in real-time
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {leaderboard.length > 0 && (
                    <div className="mt-8 text-center">
                        <div className="flex flex-wrap justify-center gap-4">
                            <button 
                                onClick={() => router.push('/dashboard/quizzes')}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                            >
                                Take Another Quiz
                            </button>
                            <button 
                                onClick={() => window.location.reload()}
                                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
