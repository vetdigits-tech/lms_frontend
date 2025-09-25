'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import QuestionBuilder from './QuestionBuilder';
import { getCsrfToken, getCookie } from '../../utils/auth';

const QuizBuilder = ({ quizId = null }) => {
    const router = useRouter();
    
    // Custom API function with token support
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

    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        time_limit_minutes: 30,
        passing_score_percentage: 70,
        shuffle_questions: false,
        is_active: true,
        max_attempts: 0,
        requires_registration: false,
        is_scheduled: false,
        scheduled_start_time: '',
        scheduled_end_time: '',
        has_registration_time_limit: false,
        registration_start_time: '',
        registration_end_time: ''
    });
    const [questions, setQuestions] = useState([]);
    const [isEditing, setIsEditing] = useState(!!quizId);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!quizId);
    const [activeTab, setActiveTab] = useState('settings');
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]); // NEW: Leaderboard data
    const [questionLoading, setQuestionLoading] = useState(false);

    useEffect(() => {
        if (quizId) {
            loadQuiz();
        }
    }, [quizId]);

    // FIXED: Proper time formatting for datetime-local inputs
    const formatDateTimeForInput = (dateTimeStr) => {
        if (!dateTimeStr) return '';
        
        try {
            // Handle both ISO strings and regular datetime strings
            const date = new Date(dateTimeStr);
            
            // Format as YYYY-MM-DDTHH:mm (datetime-local format)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting datetime:', error);
            return '';
        }
    };

    const loadQuiz = async () => {
        setInitialLoading(true);
        try {
            const response = await quizApiRequest(`/api/admin/quizzes/${quizId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load quiz');
            }

            const result = await response.json();
            const quizData = result.data;
            
            // FIXED: Proper time formatting using the new function
            setQuiz({
                title: quizData.title || '',
                description: quizData.description || '',
                time_limit_minutes: quizData.time_limit_minutes || 30,
                passing_score_percentage: quizData.passing_score_percentage || 70,
                shuffle_questions: quizData.shuffle_questions || false,
                is_active: quizData.is_active !== false,
                max_attempts: quizData.max_attempts || 0,
                requires_registration: quizData.requires_registration || false,
                is_scheduled: quizData.is_scheduled || false,
                scheduled_start_time: formatDateTimeForInput(quizData.scheduled_start_time),
                scheduled_end_time: formatDateTimeForInput(quizData.scheduled_end_time),
                has_registration_time_limit: quizData.has_registration_time_limit || false,
                registration_start_time: formatDateTimeForInput(quizData.registration_start_time),
                registration_end_time: formatDateTimeForInput(quizData.registration_end_time)
            });
            setQuestions(quizData.questions || []);
            setRegisteredUsers(quizData.registrations || []);
            setIsEditing(true);

            // NEW: Load leaderboard if quiz exists
            if (quizId) {
                loadLeaderboard();
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
            toast.error('Failed to load quiz');
        } finally {
            setInitialLoading(false);
        }
    };

    // NEW: Load leaderboard function
    const loadLeaderboard = async () => {
        if (!quizId) return;
        
        try {
            const response = await quizApiRequest(`/api/admin/quizzes/${quizId}/analytics`);
            if (response.ok) {
                const result = await response.json();
                
                // Get top attempts for leaderboard
                const attempts = result.data.recent_attempts || [];
                const completedAttempts = attempts
                    .filter(attempt => attempt.status === 'completed' && attempt.score !== null)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10); // Top 10

                setLeaderboard(completedAttempts);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    };

    const loadRegisteredUsers = async () => {
        if (!quizId || !quiz.requires_registration) return;
        
        try {
            const response = await quizApiRequest(`/api/admin/quizzes/${quizId}/registrations`);
            if (response.ok) {
                const result = await response.json();
                setRegisteredUsers(result.data.data || []);
            }
        } catch (error) {
            console.error('Error loading registered users:', error);
        }
    };

    const handleQuizSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Existing scheduling validation
        if (quiz.is_scheduled) {
            if (!quiz.scheduled_start_time || !quiz.scheduled_end_time) {
                toast.error('Please set both start and end times for scheduled quiz');
                setLoading(false);
                return;
            }
            
            if (new Date(quiz.scheduled_start_time) >= new Date(quiz.scheduled_end_time)) {
                toast.error('Start time must be before end time');
                setLoading(false);
                return;
            }
        }

        // Registration timing validation
        if (quiz.requires_registration && quiz.has_registration_time_limit) {
            if (!quiz.registration_start_time || !quiz.registration_end_time) {
                toast.error('Please set both registration start and end times');
                setLoading(false);
                return;
            }
            
            if (new Date(quiz.registration_start_time) >= new Date(quiz.registration_end_time)) {
                toast.error('Registration start time must be before end time');
                setLoading(false);
                return;
            }
            
            // If quiz is scheduled, registration should end before or at quiz start
            if (quiz.is_scheduled && quiz.scheduled_start_time) {
                if (new Date(quiz.registration_end_time) > new Date(quiz.scheduled_start_time)) {
                    toast.error('Registration must end before or when the quiz starts');
                    setLoading(false);
                    return;
                }
            }
        }

        try {
            let response;
            const submitData = {
                ...quiz,
                scheduled_start_time: quiz.is_scheduled ? quiz.scheduled_start_time : null,
                scheduled_end_time: quiz.is_scheduled ? quiz.scheduled_end_time : null,
                registration_start_time: (quiz.requires_registration && quiz.has_registration_time_limit) ? quiz.registration_start_time : null,
                registration_end_time: (quiz.requires_registration && quiz.has_registration_time_limit) ? quiz.registration_end_time : null
            };

            if (isEditing && quizId) {
                response = await quizApiRequest(`/api/admin/quizzes/${quizId}`, {
                    method: 'PUT',
                    body: JSON.stringify(submitData)
                });
            } else {
                response = await quizApiRequest('/api/admin/quizzes', {
                    method: 'POST',
                    body: JSON.stringify(submitData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save quiz');
            }

            const result = await response.json();
            
            if (isEditing) {
                toast.success('Quiz updated successfully!');
                if (quiz.requires_registration) {
                    loadRegisteredUsers();
                }
                // Reload leaderboard after update
                loadLeaderboard();
            } else {
                const newQuizId = result.data.id;
                toast.success('Quiz created successfully! Now add questions.');
                router.push(`/admin/quizzes/quiz-builder/${newQuizId}`);
            }
        } catch (error) {
            console.error('Error saving quiz:', error);
            toast.error(error.message || 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    // Question management functions (unchanged)
    const handleQuestionSave = async (questionData) => {
        setQuestionLoading(true);
        
        try {
            let response;
            if (editingQuestion) {
                response = await quizApiRequest(`/api/admin/quizzes/${quizId}/questions/${editingQuestion.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(questionData)
                });
            } else {
                response = await quizApiRequest(`/api/admin/quizzes/${quizId}/questions`, {
                    method: 'POST',
                    body: JSON.stringify(questionData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save question');
            }

            toast.success(editingQuestion ? 'Question updated successfully!' : 'Question added successfully!');
            setEditingQuestion(null);
            loadQuiz();
            setActiveTab('questions');
        } catch (error) {
            console.error('Error saving question:', error);
            toast.error(error.message || 'Failed to save question');
        } finally {
            setQuestionLoading(false);
        }
    };

    const handleQuestionCancel = () => {
        setEditingQuestion(null);
        setActiveTab('questions');
    };

    const editQuestion = (question) => {
        setEditingQuestion(question);
        setActiveTab('question-form');
    };

    const deleteQuestion = async (questionId) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const response = await quizApiRequest(`/api/admin/quizzes/${quizId}/questions/${questionId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete question');
            }

            toast.success('Question deleted successfully!');
            loadQuiz();
        } catch (error) {
            console.error('Error deleting question:', error);
            toast.error('Failed to delete question');
        }
    };

    const renderTabContent = () => {
        if (initialLoading) {
            return (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading quiz...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'settings':
                return (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-6">Quiz Settings</h2>
                        <form onSubmit={handleQuizSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quiz Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={quiz.title}
                                        onChange={(e) => setQuiz({...quiz, title: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        placeholder="Enter quiz title..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={quiz.description}
                                        onChange={(e) => setQuiz({...quiz, description: e.target.value})}
                                        rows={3}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter quiz description..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time Limit (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={quiz.time_limit_minutes}
                                        onChange={(e) => setQuiz({...quiz, time_limit_minutes: parseInt(e.target.value)})}
                                        min="1"
                                        max="300"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Passing Score (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={quiz.passing_score_percentage}
                                        onChange={(e) => setQuiz({...quiz, passing_score_percentage: parseInt(e.target.value)})}
                                        min="1"
                                        max="100"
                                        required
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Attempt Settings */}
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="text-lg font-medium text-blue-900 mb-4">Attempt Settings</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Attempts
                                    </label>
                                    <select
                                        value={quiz.max_attempts}
                                        onChange={(e) => setQuiz({...quiz, max_attempts: parseInt(e.target.value)})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={0}>Unlimited</option>
                                        <option value={1}>1 Attempt</option>
                                        <option value={2}>2 Attempts</option>
                                        <option value={3}>3 Attempts</option>
                                        <option value={5}>5 Attempts</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Set the maximum number of attempts each student can make
                                    </p>
                                </div>
                            </div>

                            {/* Enhanced Registration Settings */}
                            <div className="bg-green-50 p-6 rounded-lg">
                                <h3 className="text-lg font-medium text-green-900 mb-4">Registration Settings</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <input
                                            type="checkbox"
                                            id="requires_registration"
                                            checked={quiz.requires_registration}
                                            onChange={(e) => setQuiz({...quiz, requires_registration: e.target.checked})}
                                            className="h-5 w-5 text-green-600 rounded focus:ring-green-500 mt-1"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="requires_registration" className="text-sm font-medium text-gray-700">
                                                Require Registration
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Students must register before taking the quiz.
                                            </p>
                                        </div>
                                    </div>

                                    {quiz.requires_registration && (
                                        <>
                                            <div className="mt-3 p-3 bg-green-100 rounded border">
                                                <p className="text-sm text-green-800">
                                                    ✓ Registration is enabled.
                                                    {isEditing && registeredUsers.length > 0 && (
                                                        <span className="block mt-1 font-medium">
                                                            Currently {registeredUsers.length} student(s) registered.
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Registration Time Limits */}
                                            <div className="border-t border-green-200 pt-4">
                                                <div className="flex items-start space-x-3 mb-4">
                                                    <input
                                                        type="checkbox"
                                                        id="has_registration_time_limit"
                                                        checked={quiz.has_registration_time_limit}
                                                        onChange={(e) => setQuiz({...quiz, has_registration_time_limit: e.target.checked})}
                                                        className="h-5 w-5 text-green-600 rounded focus:ring-green-500 mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <label htmlFor="has_registration_time_limit" className="text-sm font-medium text-gray-700">
                                                            Set Registration Time Limits
                                                        </label>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Control when students can register for this quiz.
                                                        </p>
                                                    </div>
                                                </div>

                                                {quiz.has_registration_time_limit && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Registration Opens At *
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                value={quiz.registration_start_time}
                                                                onChange={(e) => setQuiz({...quiz, registration_start_time: e.target.value})}
                                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                                required={quiz.has_registration_time_limit}
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Students can start registering from this time
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Registration Closes At *
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                value={quiz.registration_end_time}
                                                                onChange={(e) => setQuiz({...quiz, registration_end_time: e.target.value})}
                                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                                required={quiz.has_registration_time_limit}
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Registration deadline
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Schedule Settings */}
                            <div className="bg-purple-50 p-6 rounded-lg">
                                <h3 className="text-lg font-medium text-purple-900 mb-4">Schedule Settings</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <input
                                            type="checkbox"
                                            id="is_scheduled"
                                            checked={quiz.is_scheduled}
                                            onChange={(e) => setQuiz({...quiz, is_scheduled: e.target.checked})}
                                            className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500 mt-1"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="is_scheduled" className="text-sm font-medium text-gray-700">
                                                Schedule Quiz
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Set specific start and end times for the quiz.
                                            </p>
                                        </div>
                                    </div>

                                    {quiz.is_scheduled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quiz Start Time *
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={quiz.scheduled_start_time}
                                                    onChange={(e) => setQuiz({...quiz, scheduled_start_time: e.target.value})}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    required={quiz.is_scheduled}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quiz End Time *
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={quiz.scheduled_end_time}
                                                    onChange={(e) => setQuiz({...quiz, scheduled_end_time: e.target.value})}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    required={quiz.is_scheduled}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline Preview */}
                                    {(quiz.has_registration_time_limit || quiz.is_scheduled) && (
                                        <div className="mt-4 p-4 bg-white border border-purple-200 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline Preview</h4>
                                            <div className="space-y-2 text-sm">
                                                {quiz.has_registration_time_limit && quiz.registration_start_time && (
                                                    <div className="flex items-center text-green-700">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                                        Registration opens: {new Date(quiz.registration_start_time).toLocaleString()}
                                                    </div>
                                                )}
                                                {quiz.has_registration_time_limit && quiz.registration_end_time && (
                                                    <div className="flex items-center text-orange-700">
                                                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                                                        Registration closes: {new Date(quiz.registration_end_time).toLocaleString()}
                                                    </div>
                                                )}
                                                {quiz.is_scheduled && quiz.scheduled_start_time && (
                                                    <div className="flex items-center text-blue-700">
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                                                        Quiz starts: {new Date(quiz.scheduled_start_time).toLocaleString()}
                                                    </div>
                                                )}
                                                {quiz.is_scheduled && quiz.scheduled_end_time && (
                                                    <div className="flex items-center text-red-700">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                                                        Quiz ends: {new Date(quiz.scheduled_end_time).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-6 p-4 bg-gray-50 rounded-lg">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={quiz.shuffle_questions}
                                        onChange={(e) => setQuiz({...quiz, shuffle_questions: e.target.checked})}
                                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Shuffle Questions</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={quiz.is_active}
                                        onChange={(e) => setQuiz({...quiz, is_active: e.target.checked})}
                                        className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                            >
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                <span>{loading ? 'Saving...' : isEditing ? 'Update Quiz' : 'Create Quiz'}</span>
                            </button>
                        </form>
                    </div>
                );

            case 'questions':
                return (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">Quiz Questions</h2>
                                <p className="text-sm text-gray-600">{questions.length} questions added</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingQuestion(null);
                                    setActiveTab('question-form');
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                            >
                                <span>➕</span>
                                <span>Add Question</span>
                            </button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-4">📝</div>
                                <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
                                <p className="mb-4">Add questions to make your quiz interactive and engaging.</p>
                                <button
                                    onClick={() => {
                                        setEditingQuestion(null);
                                        setActiveTab('question-form');
                                    }}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                                >
                                    Add Your First Question
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                        Q{index + 1}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {question.points} point{question.points !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {question.time_limit_seconds}s
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                    {question.question_text}
                                                </h3>
                                                <div className="space-y-1">
                                                    {question.options?.map((option, optIndex) => (
                                                        <div key={option.id} className="flex items-center space-x-2">
                                                            <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                                option.is_correct 
                                                                    ? 'bg-green-100 border-green-500 text-green-600' 
                                                                    : 'border-gray-300'
                                                            }`}>
                                                                {option.is_correct && '✓'}
                                                            </span>
                                                            <span className={`text-sm ${
                                                                option.is_correct ? 'text-green-700 font-medium' : 'text-gray-600'
                                                            }`}>
                                                                {String.fromCharCode(65 + optIndex)}. {option.option_text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 ml-4">
                                                <button
                                                    onClick={() => editQuestion(question)}
                                                    className="text-blue-600 hover:text-blue-700 p-2"
                                                    title="Edit Question"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => deleteQuestion(question.id)}
                                                    className="text-red-600 hover:text-red-700 p-2"
                                                    title="Delete Question"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'question-form':
                return (
                    <QuestionBuilder
                        question={editingQuestion}
                        onSave={handleQuestionSave}
                        onCancel={handleQuestionCancel}
                        loading={questionLoading}
                    />
                );

            case 'registrations':
                if (!quiz.requires_registration) {
                    return (
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <h2 className="text-xl font-semibold mb-4">Registrations</h2>
                            <p className="text-gray-600 mb-4">Registration is not enabled for this quiz.</p>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Enable Registration in Settings
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Registered Students ({registeredUsers.length})</h2>
                            <button
                                onClick={loadRegisteredUsers}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                            >
                                Refresh
                            </button>
                        </div>

                        {registeredUsers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-4">📝</div>
                                <h3 className="text-lg font-medium mb-2">No Registrations Yet</h3>
                                <p>No students have registered for this quiz yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {registeredUsers.map((registration, index) => (
                                    <div key={registration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-medium text-sm">
                                                    {registration.user?.name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {registration.user?.name || 'Unknown User'}
                                                </div>
                                                <div className="text-sm text-gray-600">{registration.user_email}</div>
                                                <div className="text-xs text-gray-500">
                                                    Registered: {new Date(registration.registered_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                registration.is_approved 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {registration.is_approved ? '✓ Approved' : '⏳ Pending'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            // NEW: Leaderboard tab
            case 'leaderboard':
                return (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-semibold">Quiz Leaderboard</h2>
                                <p className="text-sm text-gray-600">Top performing students</p>
                            </div>
                            <button
                                onClick={loadLeaderboard}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                            >
                                Refresh
                            </button>
                        </div>

                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-4">🏆</div>
                                <h3 className="text-lg font-medium mb-2">No Attempts Yet</h3>
                                <p>The leaderboard will show here once students complete the quiz.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((attempt, index) => {
                                    const isTopThree = index < 3;
                                    const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                                    
                                    return (
                                        <div 
                                            key={attempt.id} 
                                            className={`flex items-center justify-between p-4 border rounded-lg ${
                                                isTopThree 
                                                    ? 'border-yellow-200 bg-yellow-50' 
                                                    : 'border-gray-200 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center justify-center w-12">
                                                    <span className="text-lg font-bold">
                                                        {rankEmoji}
                                                    </span>
                                                </div>
                                                
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium text-sm">
                                                        {attempt.user?.name?.charAt(0) || '?'}
                                                    </span>
                                                </div>
                                                
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {attempt.user?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {attempt.user?.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Completed: {new Date(attempt.finished_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${
                                                    attempt.score >= quiz.passing_score_percentage 
                                                        ? 'text-green-600' 
                                                        : 'text-red-600'
                                                }`}>
                                                    {Math.round(attempt.score)}%
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {attempt.time_taken ? 
                                                        `${Math.floor(attempt.time_taken / 60)}:${(attempt.time_taken % 60).toString().padStart(2, '0')}` 
                                                        : 'N/A'
                                                    }
                                                </div>
                                                <div className={`text-xs font-medium ${
                                                    attempt.score >= quiz.passing_score_percentage 
                                                        ? 'text-green-600' 
                                                        : 'text-red-600'
                                                }`}>
                                                    {attempt.score >= quiz.passing_score_percentage ? 'PASSED' : 'FAILED'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Edit Quiz' : 'Create New Quiz'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {isEditing ? 'Modify your quiz settings and questions' : 'Build a comprehensive quiz with advanced features'}
                </p>
            </div>

            {/* Enhanced Tabs with Leaderboard */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'settings'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        ⚙️ Quiz Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'questions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        📝 Questions ({questions.length})
                    </button>
                    {isEditing && quiz.requires_registration && (
                        <button
                            onClick={() => {
                                setActiveTab('registrations');
                                loadRegisteredUsers();
                            }}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'registrations'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            👥 Registrations ({registeredUsers.length})
                        </button>
                    )}
                    {/* NEW: Leaderboard tab */}
                    {isEditing && (
                        <button
                            onClick={() => {
                                setActiveTab('leaderboard');
                                loadLeaderboard();
                            }}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'leaderboard'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            🏆 Leaderboard ({leaderboard.length})
                        </button>
                    )}
                    {isEditing && (
                        <button
                            onClick={() => setActiveTab('question-form')}
                            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'question-form'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {editingQuestion ? '✏️ Edit Question' : '➕ Add Question'}
                        </button>
                    )}
                </nav>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
        </div>
    );
};

export default QuizBuilder;
