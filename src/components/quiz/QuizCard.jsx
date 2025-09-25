'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getCsrfToken, getCookie } from '../../utils/auth';

const QuizCard = ({ quiz, onAction }) => {
    const router = useRouter();
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [registrationTimeRemaining, setRegistrationTimeRemaining] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(quiz.is_registered || false);

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

    useEffect(() => {
        setMounted(true);
    }, []);

    // Update countdown timers for scheduled quizzes
    useEffect(() => {
        if (quiz?.is_scheduled && mounted) {
            const updateTimer = () => {
                const now = new Date();
                const startTime = new Date(quiz.scheduled_start_time);
                const endTime = new Date(quiz.scheduled_end_time);

                if (now < startTime) {
                    setTimeRemaining(Math.floor((startTime - now) / 1000));
                } else if (now >= startTime && now <= endTime) {
                    setTimeRemaining(Math.floor((endTime - now) / 1000));
                } else {
                    setTimeRemaining(0);
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [quiz?.is_scheduled, quiz?.scheduled_start_time, quiz?.scheduled_end_time, mounted]);

    // Registration timing with better data handling
    useEffect(() => {
        if (quiz?.requires_registration && quiz?.has_registration_time_limit && mounted) {
            const updateRegistrationTimer = () => {
                const now = new Date();
                
                const parseDateTime = (dateTimeStr) => {
                    if (!dateTimeStr) return null;
                    return new Date(dateTimeStr);
                };

                const regStartTime = parseDateTime(quiz.registration_start_time);
                const regEndTime = parseDateTime(quiz.registration_end_time);

                if (regStartTime && regEndTime) {
                    if (now < regStartTime) {
                        setRegistrationTimeRemaining({
                            type: 'starts',
                            seconds: Math.floor((regStartTime - now) / 1000),
                            message: `Registration opens ${formatTimeRemaining(Math.floor((regStartTime - now) / 1000))}`
                        });
                    } else if (now >= regStartTime && now <= regEndTime) {
                        const remaining = Math.floor((regEndTime - now) / 1000);
                        setRegistrationTimeRemaining({
                            type: 'ends',
                            seconds: remaining,
                            message: `Registration closes ${formatTimeRemaining(remaining)}`,
                            urgent: remaining < 3600
                        });
                    } else {
                        setRegistrationTimeRemaining({
                            type: 'closed',
                            seconds: 0,
                            message: 'Registration period has ended'
                        });
                    }
                } else {
                    setRegistrationTimeRemaining(null);
                }
            };

            updateRegistrationTimer();
            const interval = setInterval(updateRegistrationTimer, 1000);
            return () => clearInterval(interval);
        } else {
            setRegistrationTimeRemaining(null);
        }
    }, [quiz?.requires_registration, quiz?.has_registration_time_limit, quiz?.registration_start_time, quiz?.registration_end_time, mounted]);

    // Popup functions
    const showQuizEndedPopup = () => {
        alert('This quiz has ended and is no longer available for taking.');
    };

    const showRegistrationClosedPopup = () => {
        alert('Registration for this quiz has closed and is no longer available.');
    };

    const showNoAttemptsPopup = () => {
        alert(`You have already used all ${quiz.max_attempts} attempts for this quiz.`);
    };

    const showRegistrationRequiredPopup = () => {
        alert('You must register for this quiz before you can take it.');
    };

    // FIXED: Handle card click with proper unlimited attempts logic
    const handleCardClick = () => {
        const statusInfo = getQuizStatus();
        const registrationInfo = getRegistrationStatus();
        const attemptInfo = getAttemptStatus();

        // Check if quiz is ended
        if (statusInfo.status === 'ended') {
            showQuizEndedPopup();
            return;
        }

        // FIXED: Check if no attempts left (properly handle unlimited)
        if (!attemptInfo.hasAttemptsLeft) {
            showNoAttemptsPopup();
            return;
        }

        // Check if registration is required but user is not registered
        if (quiz.requires_registration && !isRegistered) {
            if (registrationInfo.status === 'closed') {
                showRegistrationClosedPopup();
                return;
            } else if (registrationInfo.status === 'not_started') {
                alert('Registration for this quiz has not started yet.');
                return;
            } else {
                showRegistrationRequiredPopup();
                return;
            }
        }

        // If all checks pass, navigate to quiz
        router.push(`/dashboard/quizzes/${quiz.id}`);
    };

    // Handle register with proper blocking
    const handleRegister = async (e) => {
        e.stopPropagation();
        
        const registrationInfo = getRegistrationStatus();
        const statusInfo = getQuizStatus();

        // Check if registration is closed
        if (registrationInfo.status === 'closed') {
            showRegistrationClosedPopup();
            return;
        }

        // Check if quiz is ended
        if (statusInfo.status === 'ended') {
            showQuizEndedPopup();
            return;
        }

        // Check if registration hasn't started
        if (registrationInfo.status === 'not_started') {
            alert('Registration for this quiz has not started yet.');
            return;
        }

        if (!registrationInfo.canRegister) {
            alert('Registration is not available at this time.');
            return;
        }

        setRegistering(true);

        try {
            const response = await quizApiRequest(`/api/quizzes/${quiz.id}/register`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to register');
            }

            setIsRegistered(true);
            toast.success('Successfully registered for quiz!');

            if (onAction) {
                onAction('refresh');
            }

        } catch (error) {
            console.error('Error registering:', error);
            toast.error(error.message || 'Failed to register for quiz');
        } finally {
            setRegistering(false);
        }
    };

    const getRegistrationStatus = () => {
        if (!quiz.requires_registration) {
            return { status: 'not_required' };
        }

        if (isRegistered) {
            return {
                status: 'registered',
                message: 'Registered Successfully',
                color: 'green'
            };
        }

        if (!quiz.has_registration_time_limit) {
            return {
                status: 'open',
                message: 'Registration Open',
                subtitle: 'Register to take this quiz',
                color: 'blue',
                canRegister: true
            };
        }

        if (registrationTimeRemaining) {
            switch (registrationTimeRemaining.type) {
                case 'starts':
                    return {
                        status: 'not_started',
                        message: 'Registration Opens Soon',
                        subtitle: registrationTimeRemaining.message,
                        color: 'yellow',
                        canRegister: false
                    };
                case 'ends':
                    return {
                        status: 'open',
                        message: 'Registration Open',
                        subtitle: registrationTimeRemaining.message,
                        color: registrationTimeRemaining.urgent ? 'orange' : 'blue',
                        canRegister: true,
                        urgent: registrationTimeRemaining.urgent
                    };
                case 'closed':
                    return {
                        status: 'closed',
                        message: 'Registration Closed',
                        subtitle: 'Registration period has ended',
                        color: 'red',
                        canRegister: false
                    };
            }
        }

        return {
            status: 'open',
            message: 'Registration Required',
            subtitle: 'Register to take this quiz',
            color: 'blue',
            canRegister: true
        };
    };

    const getQuizStatus = () => {
        if (!quiz.is_scheduled) {
            return {
                status: 'available',
                message: 'Available Now',
                color: 'green',
                bgColor: 'bg-green-100',
                textColor: 'text-green-800',
                canTake: quiz.can_take
            };
        }

        const now = new Date();
        const startTime = new Date(quiz.scheduled_start_time);
        const endTime = new Date(quiz.scheduled_end_time);

        if (now < startTime) {
            return {
                status: 'upcoming',
                message: `Starts ${formatTimeRemaining(timeRemaining)}`,
                color: 'yellow',
                bgColor: 'bg-yellow-100',
                textColor: 'text-yellow-800',
                canTake: false
            };
        } else if (now >= startTime && now <= endTime) {
            return {
                status: 'active',
                message: `Ends ${formatTimeRemaining(timeRemaining)}`,
                color: 'blue',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-800',
                canTake: quiz.can_take
            };
        } else {
            return {
                status: 'ended',
                message: 'Quiz Ended',
                color: 'red',
                bgColor: 'bg-red-100',
                textColor: 'text-red-800',
                canTake: false
            };
        }
    };

    const formatTimeRemaining = (seconds) => {
        if (!seconds || seconds <= 0) return 'now';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) return `in ${days}d ${hours}h`;
        if (hours > 0) return `in ${hours}h ${minutes}m`;
        if (minutes > 0) return `in ${minutes}m`;
        return `in ${secs}s`;
    };

    // FIXED: Properly handle unlimited attempts
    const getAttemptStatus = () => {
        // FIXED: Properly handle unlimited attempts
        if (quiz.max_attempts === 0) {
            return {
                text: 'Unlimited attempts',
                color: 'text-green-600',
                displayText: 'Unlimited',
                hasAttemptsLeft: true // Add this flag
            };
        }

        const used = quiz.user_attempts || 0;
        const remaining = quiz.max_attempts - used;

        if (remaining <= 0) {
            return {
                text: 'No attempts remaining',
                color: 'text-red-600',
                displayText: `${quiz.max_attempts} ${quiz.max_attempts === 1 ? 'attempt' : 'attempts'}`,
                hasAttemptsLeft: false // Add this flag
            };
        }

        return {
            text: `${remaining} attempt${remaining === 1 ? '' : 's'} remaining`,
            color: remaining <= 1 ? 'text-orange-600' : 'text-green-600',
            displayText: `${quiz.max_attempts} ${quiz.max_attempts === 1 ? 'attempt' : 'attempts'}`,
            hasAttemptsLeft: true // Add this flag
        };
    };

    const getScoreDisplay = () => {
        if (quiz.best_score !== null && quiz.best_score !== undefined) {
            const isPassing = quiz.best_score >= quiz.passing_score_percentage;
            return {
                score: Math.round(quiz.best_score),
                color: isPassing ? 'text-green-600' : 'text-red-600',
                bgColor: isPassing ? 'bg-green-50' : 'bg-red-50',
                status: isPassing ? 'Passed' : 'Failed'
            };
        }
        return null;
    };

    const statusInfo = getQuizStatus();
    const attemptInfo = getAttemptStatus();
    const scoreInfo = getScoreDisplay();
    const registrationInfo = getRegistrationStatus();

    // FIXED: Determine if card should be clickable with proper unlimited attempts logic
    const isClickable = () => {
        return !(
            statusInfo.status === 'ended' ||
            !attemptInfo.hasAttemptsLeft || // FIXED: Use the new flag
            (quiz.requires_registration && !isRegistered && registrationInfo.status === 'closed')
        );
    };

    if (!mounted) return null;

    return (
        <div
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 ${
                isClickable() ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
            } ${statusInfo.status === 'ended' ? 'bg-gray-50' : ''}`}
            onClick={handleCardClick}
        >
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-xl font-semibold line-clamp-2 flex-1 mr-3 ${
                        statusInfo.status === 'ended' ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                        {quiz.title}
                        {statusInfo.status === 'ended' && <span className="ml-2 text-red-500 text-sm">(Ended)</span>}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} whitespace-nowrap`}>
                        {statusInfo.status === 'ended' && '🚫 '}
                        {statusInfo.message}
                    </div>
                </div>

                {quiz.description && (
                    <p className={`text-sm line-clamp-2 mb-4 ${
                        statusInfo.status === 'ended' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                        {quiz.description}
                    </p>
                )}
            </div>

            {/* Quiz Stats - Muted when ended */}
            <div className="px-6 pb-4">
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className={`text-lg font-bold ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-blue-600'
                        }`}>
                            {quiz.questions_count || quiz.total_questions || 0}
                        </div>
                        <div className={`text-xs ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Questions</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-lg font-bold ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-purple-600'
                        }`}>
                            {quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : 'No'}
                        </div>
                        <div className={`text-xs ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Time Limit</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-lg font-bold ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-green-600'
                        }`}>
                            {quiz.passing_score_percentage}%
                        </div>
                        <div className={`text-xs ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-gray-500'
                        }`}>Pass Score</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-lg font-bold ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-orange-600'
                        }`}>
                            {quiz.max_attempts === 0 ? '∞' : quiz.max_attempts}
                        </div>
                        <div className={`text-xs ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            {quiz.max_attempts === 0 ? 'Attempts' : quiz.max_attempts === 1 ? 'Attempt' : 'Attempts'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Info Section */}
            <div className="px-6 pb-4 space-y-3">
                {/* Best Score */}
                {scoreInfo && (
                    <div className="flex justify-between items-center text-sm">
                        <span className={statusInfo.status === 'ended' ? 'text-gray-500' : 'text-gray-600'}>
                            Best Score:
                        </span>
                        <span className={`font-medium ${
                            statusInfo.status === 'ended' ? 'text-gray-500' : scoreInfo.color
                        }`}>
                            {scoreInfo.score}% ({scoreInfo.status})
                        </span>
                    </div>
                )}

                {/* Schedule Information */}
                {quiz.is_scheduled && (
                    <div className={`text-sm ${statusInfo.status === 'ended' ? 'text-gray-500' : 'text-gray-600'}`}>
                        <div className="flex justify-between items-center">
                            <span>Schedule:</span>
                            <span className="font-medium">
                                {new Date(quiz.scheduled_start_time).toLocaleDateString('en-US', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className={`text-xs mt-1 text-right ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            {new Date(quiz.scheduled_start_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })} - {new Date(quiz.scheduled_end_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })}
                        </div>
                    </div>
                )}

                {/* Registration Timing Display */}
                {quiz.requires_registration && quiz.has_registration_time_limit && (
                    <div className={`text-sm ${statusInfo.status === 'ended' ? 'text-gray-500' : 'text-gray-600'}`}>
                        <div className="flex justify-between items-center">
                            <span>Registration:</span>
                            <span className="font-medium">
                                {new Date(quiz.registration_start_time).toLocaleDateString('en-US', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className={`text-xs mt-1 text-right ${
                            statusInfo.status === 'ended' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            {new Date(quiz.registration_start_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })} - {new Date(quiz.registration_end_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Registration Section */}
            {quiz.requires_registration && (
                <div className="px-6 pb-4">
                    {registrationInfo.status === 'registered' ? (
                        <div className={`border rounded-lg p-3 ${
                            statusInfo.status === 'ended' 
                                ? 'bg-gray-100 border-gray-300' 
                                : 'bg-green-50 border-green-200'
                        }`}>
                            <div className={`flex items-center ${
                                statusInfo.status === 'ended' ? 'text-gray-600' : 'text-green-800'
                            }`}>
                                <span className="text-lg mr-2">
                                    {statusInfo.status === 'ended' ? '🔒' : '✅'}
                                </span>
                                <div className="text-sm">
                                    <div className="font-medium">
                                        Registered Successfully
                                        {statusInfo.status === 'ended' && ' (Quiz Ended)'}
                                    </div>
                                    {statusInfo.status !== 'ended' && quiz.is_scheduled && statusInfo.status === 'upcoming' && timeRemaining > 0 && (
                                        <div className="text-xs text-green-600 mt-1">
                                            <strong>Quiz starts {formatTimeRemaining(timeRemaining)}</strong>
                                        </div>
                                    )}
                                    {statusInfo.status !== 'ended' && quiz.is_scheduled && statusInfo.status === 'active' && timeRemaining > 0 && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            <strong>⏰ Quiz ends {formatTimeRemaining(timeRemaining)}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : registrationInfo.status === 'not_started' ? (
                        <div className={`border rounded-lg p-3 ${
                            statusInfo.status === 'ended' 
                                ? 'bg-gray-100 border-gray-300' 
                                : 'bg-yellow-50 border-yellow-200'
                        }`}>
                            <div className={`flex items-center ${
                                statusInfo.status === 'ended' ? 'text-gray-600' : 'text-yellow-800'
                            }`}>
                                <span className="text-lg mr-2">
                                    {statusInfo.status === 'ended' ? '🔒' : '⏰'}
                                </span>
                                <div className="text-sm">
                                    <div className="font-medium">
                                        {statusInfo.status === 'ended' ? 'Registration Closed (Quiz Ended)' : registrationInfo.message}
                                    </div>
                                    <div className={`text-xs mt-1 ${
                                        statusInfo.status === 'ended' ? 'text-gray-500' : 'text-yellow-600'
                                    }`}>
                                        <strong>
                                            {statusInfo.status === 'ended' ? 'Quiz has ended' : registrationInfo.subtitle}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : registrationInfo.status === 'closed' ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center text-red-800">
                                <span className="text-lg mr-2">🚫</span>
                                <div className="text-sm">
                                    <div className="font-medium">{registrationInfo.message}</div>
                                    <div className="text-xs text-red-600 mt-1">
                                        {registrationInfo.subtitle}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`border rounded-lg p-3 ${
                            statusInfo.status === 'ended' 
                                ? 'bg-gray-100 border-gray-300' 
                                : registrationInfo.urgent 
                                    ? 'bg-orange-50 border-orange-200' 
                                    : 'bg-blue-50 border-blue-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className={`flex items-center ${
                                    statusInfo.status === 'ended' 
                                        ? 'text-gray-600'
                                        : registrationInfo.urgent 
                                            ? 'text-orange-800' 
                                            : 'text-blue-800'
                                }`}>
                                    <span className="text-lg mr-2">
                                        {statusInfo.status === 'ended' 
                                            ? '🔒' 
                                            : registrationInfo.urgent 
                                                ? '⚠️' 
                                                : '📝'}
                                    </span>
                                    <div className="text-sm">
                                        <div className="font-medium">
                                            {statusInfo.status === 'ended' ? 'Registration Closed (Quiz Ended)' : registrationInfo.message}
                                        </div>
                                        <div className={`text-xs mt-1 ${
                                            statusInfo.status === 'ended' 
                                                ? 'text-gray-500'
                                                : registrationInfo.urgent 
                                                    ? 'text-orange-600 font-semibold' 
                                                    : 'text-blue-600'
                                        }`}>
                                            {statusInfo.status === 'ended' ? 'Quiz has ended' : registrationInfo.subtitle}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRegister}
                                    disabled={registering || !registrationInfo.canRegister || statusInfo.status === 'ended'}
                                    className={`${
                                        statusInfo.status === 'ended' 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : registrationInfo.urgent 
                                                ? 'bg-orange-600 hover:bg-orange-700' 
                                                : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center space-x-1`}
                                >
                                    {registering && statusInfo.status !== 'ended' && (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    )}
                                    <span>
                                        {statusInfo.status === 'ended' 
                                            ? 'Ended' 
                                            : registering 
                                                ? 'Registering...' 
                                                : 'Register'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Warning Messages */}
            <div className="px-6 pb-4">
                {/* FIXED: No Attempts Left Warning with proper unlimited logic */}
                {!attemptInfo.hasAttemptsLeft && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center text-red-800">
                            <span className="text-lg mr-2">🚫</span>
                            <div className="text-sm">
                                <div className="font-medium">No Attempts Left</div>
                                <div className="text-xs text-red-600 mt-1">
                                    You have used all {quiz.max_attempts} attempts
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quiz Ended Warning */}
                {quiz.is_scheduled && statusInfo.status === 'ended' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center text-gray-700">
                            <span className="text-lg mr-2">⏱️</span>
                            <div className="text-sm">
                                <div className="font-medium">Quiz Ended</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    This quiz is no longer available
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FIXED: Action Buttons with proper unlimited attempts logic */}
            <div className="px-6 pb-6">
                <div className="flex space-x-3">
                    <button
                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                            statusInfo.canTake &&
                            attemptInfo.hasAttemptsLeft && // FIXED: Use the new flag
                            (!quiz.requires_registration || isRegistered) &&
                            statusInfo.status !== 'ended'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick();
                        }}
                        disabled={
                            !statusInfo.canTake ||
                            !attemptInfo.hasAttemptsLeft || // FIXED: Use the new flag
                            (quiz.requires_registration && !isRegistered) ||
                            statusInfo.status === 'ended'
                        }
                    >
                        {statusInfo.status === 'ended' ? '🚫 Ended' :
                            !statusInfo.canTake && statusInfo.status === 'upcoming' ? 'Scheduled' :
                                !attemptInfo.hasAttemptsLeft ? 'No Attempts Left' : // FIXED: Use the new flag
                                    quiz.requires_registration && !isRegistered ? 'Register First' :
                                        scoreInfo ? 'Retake Quiz' : 'Take Quiz'}
                    </button>

                    <button
                        className={`px-4 py-2 transition-colors ${
                            statusInfo.status === 'ended' 
                                ? 'text-gray-400 cursor-default' 
                                : 'text-gray-600 hover:text-blue-600'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick();
                        }}
                        title="View Details"
                    >
                        👁️
                    </button>
                </div>
            </div>

            {/* Footer Stats */}
            <div className={`border-t px-6 py-3 rounded-b-lg ${
                statusInfo.status === 'ended' 
                    ? 'border-gray-200 bg-gray-100' 
                    : 'border-gray-100 bg-gray-50'
            }`}>
                <div className={`flex justify-between items-center text-xs ${
                    statusInfo.status === 'ended' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                    <span>
                        {quiz.user_attempts || 0} attempt{(quiz.user_attempts || 0) === 1 ? '' : 's'} made
                    </span>
                    <span>
                        {quiz.total_attempts || 0} total attempt{(quiz.total_attempts || 0) === 1 ? '' : 's'}
                    </span>
                    {quiz.requires_registration && (
                        <span className="flex items-center">
                            📝 Registration {
                                statusInfo.status === 'ended' ? '🔒' :
                                isRegistered ? '✓' : 
                                registrationInfo.status === 'not_started' ? '⏰' :
                                registrationInfo.status === 'closed' ? '🚫' : 'required'
                            }
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizCard;
