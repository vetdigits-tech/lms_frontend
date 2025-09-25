'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/auth';
import LoadingSpinner from '../common/LoadingSpinner';
import UserPerformanceCard from './UserPerformanceCard';
import LeaderboardStats from './LeaderboardStats';

const QuizLeaderboard = ({ quizId, showUserPosition = true, limit = 100 }) => {
    const [leaderboard, setLeaderboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLeaderboard();
    }, [quizId]);

    const loadLeaderboard = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        
        try {
            const response = await apiRequest(`/api/quizzes/${quizId}/leaderboard?limit=${limit}`);
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data.data);
            } else {
                throw new Error('Failed to load leaderboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const refreshLeaderboard = async () => {
        setRefreshing(true);
        await loadLeaderboard(false);
        setRefreshing(false);
    };

    const getBadgeColor = (badge) => {
        const colors = {
            legendary: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
            excellent: 'bg-gradient-to-r from-green-400 to-green-600 text-white',
            great: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
            good: 'bg-gradient-to-r from-purple-400 to-purple-600 text-white',
            average: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
            needs_improvement: 'bg-gray-400 text-white'
        };
        return colors[badge] || colors.needs_improvement;
    };

    const getRankIcon = (rank, isPodium) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return isPodium ? '🏆' : `#${rank}`;
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <LoadingSpinner />;
    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-600 mb-4">❌ Error: {error}</div>
                <button 
                    onClick={() => loadLeaderboard()} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Try Again
                </button>
            </div>
        );
    }
    if (!leaderboard) return <div>No leaderboard data available</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{leaderboard.quiz.title}</h1>
                        <p className="text-gray-600 mt-1">Leaderboard</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={refreshLeaderboard}
                            disabled={refreshing}
                            className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                        >
                            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        <div className="text-sm text-gray-500">
                            {leaderboard.total_entries} participants
                        </div>
                    </div>
                </div>

                {/* Quiz Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{leaderboard.quiz.total_questions}</div>
                        <div className="text-xs text-blue-700">Questions</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{leaderboard.quiz.time_limit_minutes}min</div>
                        <div className="text-xs text-green-700">Time Limit</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{leaderboard.quiz.passing_score}%</div>
                        <div className="text-xs text-purple-700">Passing Score</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{leaderboard.stats.total_participants}</div>
                        <div className="text-xs text-orange-700">Total Attempts</div>
                    </div>
                </div>
            </div>

            {/* User Position */}
            {showUserPosition && leaderboard.user_position && (
                <UserPerformanceCard userPosition={leaderboard.user_position} />
            )}

            {/* Statistics */}
            <LeaderboardStats stats={leaderboard.stats} />

            {/* Leaderboard Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Rankings</h3>
                    <div className="text-sm text-gray-500">
                        Updated: {new Date(leaderboard.last_updated).toLocaleString()}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaderboard.leaderboard.map((entry, index) => (
                                <tr 
                                    key={entry.user.id} 
                                    className={`${
                                        entry.is_podium 
                                            ? 'bg-gradient-to-r from-yellow-50 to-transparent hover:from-yellow-100' 
                                            : 'hover:bg-gray-50'
                                    } transition-colors duration-200`}
                                >
                                    {/* Rank */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`text-2xl font-bold ${entry.is_podium ? 'animate-pulse' : ''}`}>
                                                {getRankIcon(entry.rank, entry.is_podium)}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Participant */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white font-medium ${
                                                entry.is_podium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gray-400'
                                            }`}>
                                                {entry.user.initials}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{entry.user.name}</div>
                                                {entry.is_podium && (
                                                    <div className="text-xs text-yellow-600 font-medium">🏆 Top Performer</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Score */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-lg font-bold text-green-600">{entry.score_percentage}%</div>
                                        <div className="text-xs text-gray-500">{entry.correct_answers}/{entry.total_questions}</div>
                                    </td>
                                    
                                    {/* Accuracy */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm font-medium">{entry.accuracy_rate}%</div>
                                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                            <div 
                                                className="bg-blue-600 h-1 rounded-full" 
                                                style={{width: `${entry.accuracy_rate}%`}}
                                            ></div>
                                        </div>
                                    </td>
                                    
                                    {/* Time */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="text-sm font-medium">{entry.time_taken}</div>
                                        <div className="text-xs text-gray-500">
                                            {(entry.speed_score * 100).toFixed(1)} pts/min
                                        </div>
                                    </td>
                                    
                                    {/* Performance Badge */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(entry.performance_badge)}`}>
                                            {entry.badge_display}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View More Button */}
            {leaderboard.total_entries > leaderboard.leaderboard.length && (
                <div className="text-center">
                    <button 
                        onClick={() => window.open(`/quiz/${quizId}/leaderboard/full`, '_blank')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        View Full Leaderboard ({leaderboard.total_entries - leaderboard.leaderboard.length} more)
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
                <p>Leaderboard updates automatically after each quiz completion</p>
                <p>Rankings are based on score, then time taken, then completion order</p>
            </div>
        </div>
    );
};

export default QuizLeaderboard;
