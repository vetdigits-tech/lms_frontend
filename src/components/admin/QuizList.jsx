'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { getCsrfToken, getCookie } from '../../utils/auth';

const QuizList = ({ onStatsUpdate }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDeleteDialog, setShowDeleteDialog] = useState(null);

    // Custom API function with token support (same as QuizBuilder)
    const quizApiRequest = async (url, options = {}) => {
        await getCsrfToken();
        const xsrfToken = getCookie('XSRF-TOKEN');
        const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        };
        
        return fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`, {
            credentials: 'include',
            headers,
            ...options
        });
    };

    useEffect(() => {
        loadQuizzes();
    }, [currentPage]);

    const loadQuizzes = async () => {
        setLoading(true);
        try {
            const response = await quizApiRequest(`/api/admin/quizzes?page=${currentPage}`);
            
            if (!response.ok) {
                throw new Error('Failed to load quizzes');
            }

            const result = await response.json();
            const data = result.data;
            setQuizzes(data.data || []);
            setTotalPages(data.last_page || 1);
            
            if (onStatsUpdate) {
                onStatsUpdate();
            }
        } catch (error) {
            console.error('Error loading quizzes:', error);
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (quiz, forceDelete = false) => {
        setDeleteLoading(quiz.id);

        try {
            console.log(`Attempting to delete quiz ${quiz.id}...`);
            
            const response = await quizApiRequest(`/api/admin/quizzes/${quiz.id}${forceDelete ? '?force=true' : ''}`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);
                
                let errorMessage = 'Failed to delete quiz';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Delete success:', result);

            toast.success(`Quiz "${quiz.title}" deleted successfully`);
            setShowDeleteDialog(null);
            await loadQuizzes();
            
        } catch (error) {
            console.error('Error deleting quiz:', error);
            toast.error(error.message || 'Failed to delete quiz');
        } finally {
            setDeleteLoading(null);
        }
    };

    const showDeleteConfirmation = (quiz) => {
        setShowDeleteDialog(quiz);
    };

    const toggleStatus = async (quiz) => {
        try {
            const response = await quizApiRequest(`/api/admin/quizzes/${quiz.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...quiz,
                    is_active: !quiz.is_active
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update quiz status');
            }

            toast.success(`Quiz ${quiz.is_active ? 'deactivated' : 'activated'} successfully`);
            loadQuizzes();
        } catch (error) {
            console.error('Error updating quiz status:', error);
            toast.error('Failed to update quiz status');
        }
    };

    const handleNavigation = (path) => {
        if (router && router.push) {
            router.push(path);
        } else {
            window.location.href = path;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-gray-600">Loading quizzes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Quiz List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">All Quizzes</h2>
                    <button
                        onClick={() => handleNavigation('/admin/quizzes/quiz-builder')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Quick Create</span>
                    </button>
                </div>
                
                {quizzes.length === 0 ? (
                    <div className="p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new quiz.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => handleNavigation('/admin/quizzes/quiz-builder')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Create New Quiz
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {quizzes.map((quiz) => (
                                    <tr key={quiz.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                                                {quiz.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {quiz.description}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No time limit'} • 
                                                    {quiz.passing_score_percentage}% to pass
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{quiz.questions_count || 0}</div>
                                            <div className="text-xs text-gray-500">questions</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{quiz.attempts_count || 0}</div>
                                            <div className="text-xs text-gray-500">attempts</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleStatus(quiz)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    quiz.is_active
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                }`}
                                            >
                                                {quiz.is_active ? 'Active' : 'Draft'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(quiz.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleNavigation(`/admin/quizzes/${quiz.id}`)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                                                    title="View Quiz Details"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleNavigation(`/admin/quizzes/quiz-builder/${quiz.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-xs"
                                                    title="Edit Quiz"
                                                >
                                                    Edit
                                                </button>
                                                
                                                {/* Always show delete button */}
                                                <button
                                                    onClick={() => showDeleteConfirmation(quiz)}
                                                    disabled={deleteLoading === quiz.id}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs flex items-center space-x-1 disabled:opacity-50"
                                                    title="Delete Quiz"
                                                >
                                                    {deleteLoading === quiz.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                                            <span>Deleting...</span>
                                                        </>
                                                    ) : (
                                                        <span>Delete</span>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-gray-900">Delete Quiz</h3>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    Are you sure you want to delete <strong>"{showDeleteDialog.title}"</strong>?
                                </p>
                                
                                {showDeleteDialog.attempts_count > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                        <div className="flex">
                                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-yellow-800">
                                                    Warning: This quiz has {showDeleteDialog.attempts_count} student attempts
                                                </h3>
                                                <div className="text-sm text-yellow-700 mt-1">
                                                    Deleting this quiz will permanently remove all student attempts and results.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <p className="text-sm text-gray-600">
                                    This action will permanently delete:
                                </p>
                                <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc">
                                    <li>The quiz and all its questions</li>
                                    <li>All student attempts and results</li>
                                    <li>All leaderboard entries</li>
                                    <li>All related analytics data</li>
                                </ul>
                                <p className="text-sm font-medium text-red-600 mt-2">
                                    This action cannot be undone.
                                </p>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteDialog(null)}
                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                    disabled={deleteLoading === showDeleteDialog.id}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteDialog, true)}
                                    disabled={deleteLoading === showDeleteDialog.id}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    {deleteLoading === showDeleteDialog.id ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Yes, Delete Quiz</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizList;
