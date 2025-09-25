'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { apiRequest } from '../../utils/auth';

const QuizTaker = ({ quizId }) => {
    const router = useRouter();
    const [quiz, setQuiz] = useState(null);
    const [user, setUser] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [quizTimeRemaining, setQuizTimeRemaining] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isFinalized, setIsFinalized] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentStep, setCurrentStep] = useState('instructions');

    // Progress tracking
    const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Simple registration states
    const [isRegistered, setIsRegistered] = useState(false);
    const [registering, setRegistering] = useState(false);

    // Warning states
    const [showTimeWarning, setShowTimeWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const timerRef = useRef(null);
    const quizTimerRef = useRef(null);
    const questionStartedAt = useRef(null);
    const hasRecordedTabSwitch = useRef(false);
    const warningShown = useRef({ fiveMin: false, oneMin: false });

    useEffect(() => {
        setMounted(true);
        if (quizId) {
            loadQuizDetails();
            loadUser();
        }
    }, [quizId]);

    const loadUser = async () => {
        try {
            const response = await apiRequest('/api/user');
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const loadQuizDetails = async () => {
        setInitialLoading(true);
        try {
            const response = await apiRequest(`/api/quizzes/${quizId}`);

            if (!response.ok) {
                throw new Error('Failed to load quiz details');
            }

            const result = await response.json();
            const quizData = result.data;

            setQuiz(quizData.quiz);
            setIsRegistered(quizData.is_registered || false);
            setTotalQuestions(quizData.quiz.questions_count || quizData.quiz.total_questions || 0);

        } catch (error) {
            console.error('Error loading quiz details:', error);
            toast.error('Failed to load quiz details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!quiz.requires_registration) {
            return;
        }

        setRegistering(true);
        try {
            const response = await apiRequest(`/api/quizzes/${quizId}/register`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to register');
            }

            setIsRegistered(true);
            toast.success('Successfully registered for quiz!');

        } catch (error) {
            console.error('Error registering:', error);
            toast.error(error.message || 'Failed to register for quiz');
        } finally {
            setRegistering(false);
        }
    };

    const handleNavigation = (path) => {
        if (mounted && router) {
            router.push(path);
        } else {
            window.location.href = path;
        }
    };

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden && !isFinalized && attempt && hasStarted && !hasRecordedTabSwitch.current) {
            hasRecordedTabSwitch.current = true;
            recordEventAndFinalize('tab_switch', 'Tab switching detected');
        }
    }, [attempt, isFinalized, hasStarted]);

    const handleWindowBlur = useCallback(() => {
        if (!isFinalized && attempt && hasStarted && !hasRecordedTabSwitch.current) {
            hasRecordedTabSwitch.current = true;
            recordEventAndFinalize('window_blur', 'Window focus lost');
        }
    }, [attempt, isFinalized, hasStarted]);

    const handleKeyDown = useCallback((e) => {
        if (!hasStarted) return;

        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            recordEventAndFinalize('prohibited_key_attempt', 'Developer tools usage attempted');
        }
    }, [hasStarted]);

    const handleContextMenu = useCallback((e) => {
        if (hasStarted) {
            e.preventDefault();
            recordEventAndFinalize('right_click_attempt', 'Right-click attempted');
        }
    }, [hasStarted]);

    useEffect(() => {
        if (hasStarted && mounted) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleWindowBlur);
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('contextmenu', handleContextMenu);

            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
        }

        return () => {
            if (hasStarted) {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('blur', handleWindowBlur);
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('contextmenu', handleContextMenu);

                document.body.style.userSelect = '';
                document.body.style.webkitUserSelect = '';
                document.body.style.mozUserSelect = '';
                document.body.style.msUserSelect = '';
            }
        };
    }, [hasStarted, mounted, handleVisibilityChange, handleWindowBlur, handleKeyDown, handleContextMenu]);

    useEffect(() => {
        if (timeRemaining > 0 && !isFinalized && hasStarted && !submitting) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        submitCurrentAnswer(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                 timerRef.current = null;
            }
        };
    }, [timeRemaining, isFinalized, hasStarted, submitting]);

    useEffect(() => {
        if (quizTimeRemaining > 0 && !isFinalized && hasStarted) {
            quizTimerRef.current = setInterval(() => {
                setQuizTimeRemaining(prev => {
                    if (prev === 300 && !warningShown.current.fiveMin) {
                        setShowTimeWarning(true);
                        setWarningMessage('⚠️ Only 5 minutes remaining!');
                        warningShown.current.fiveMin = true;
                        setTimeout(() => setShowTimeWarning(false), 5000);
                    }

                    if (prev === 60 && !warningShown.current.oneMin) {
                        setShowTimeWarning(true);
                        setWarningMessage('🚨 Only 1 minute remaining!');
                        warningShown.current.oneMin = true;
                        setTimeout(() => setShowTimeWarning(false), 5000);
                    }

                    if (prev <= 1) {
                        recordEventAndFinalize('time_expired', 'Quiz time expired');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (quizTimerRef.current) {
                clearInterval(quizTimerRef.current);
            }
        };
    }, [quizTimeRemaining, isFinalized, hasStarted]);

    const recordEvent = async (eventType, eventData = {}) => {
        if (!attempt) return;

        try {
            await apiRequest(`/api/quiz-attempts/${attempt.id}/events`, {
                method: 'POST',
                body: JSON.stringify({
                    event_type: eventType,
                    event_data: eventData
                })
            });
        } catch (error) {
            // Silent fail for events
        }
    };

    // FIXED: Policy violation handling - go directly to results
    const recordEventAndFinalize = async (eventType, reason) => {
        if (!attempt || isFinalized) return;

        setIsFinalized(true);

        try {
            await apiRequest(`/api/quiz-attempts/${attempt.id}/events`, {
                method: 'POST',
                body: JSON.stringify({
                    event_type: eventType,
                    event_data: { reason },
                    is_policy_violation: true
                })
            });
        } catch (error) {
            // Silent fail
        }

        // Clear all timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (quizTimerRef.current) clearInterval(quizTimerRef.current);

        // Show brief notification then redirect immediately
        toast.error(`Quiz terminated: ${reason}`);

        // Redirect directly to results with violation reason
        setTimeout(() => {
            handleNavigation(`/dashboard/quizzes/results/${attempt.id}?reason=policy_violation&violation=${encodeURIComponent(reason)}`);
        }, 1000);
    };

    // Add this ref near the top with other refs
const quizStartedAt = useRef(null);

// Update startQuiz function
const startQuiz = async () => {
    setLoading(true);
    try {
        const response = await apiRequest(`/api/quizzes/${quizId}/start`, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to start quiz');
        }

        const result = await response.json();
        const { attempt: newAttempt, server_time } = result.data;

        setAttempt(newAttempt);
        setHasStarted(true);
        setTotalQuestions(newAttempt.total_questions || quiz.questions_count || quiz.total_questions || 0);

        // FIXED: Set quiz start time and initial quiz time remaining
        quizStartedAt.current = new Date(newAttempt.started_at);
        if (quiz.time_limit_minutes) {
            setQuizTimeRemaining(quiz.time_limit_minutes * 60); // Convert to seconds
        }

        await loadCurrentQuestion(newAttempt);
    } catch (error) {
        console.error('Error starting quiz:', error);
        toast.error(error.message || 'Failed to start quiz. Please try again.');
    } finally {
        setLoading(false);
    }
};

// Update loadCurrentQuestion function
const loadCurrentQuestion = async (attemptData = attempt) => {
    if (!attemptData) return;

    if (hasStarted) setLoading(true);

    try {
        const response = await apiRequest(`/api/quiz-attempts/${attemptData.id}/question`);

        if (!response.ok) {
            const errorText = await response.text();
            
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.action === 'redirect_to_results') {
                    handleNavigation(`/dashboard/quizzes/results/${attemptData.id}?reason=time_expired`);
                } else {
                    throw new Error(errorData.message || 'Failed to load question');
                }
            } catch (parseError) {
                throw new Error('Failed to load question');
            }
            return;
        }

        const result = await response.json();
        const data = result.data;

        if (data.completed) {
            handleNavigation(`/dashboard/quizzes/results/${attemptData.id}`);
            return;
        }

        setCurrentQuestion(data.question);
        setTimeRemaining(data.attempt_info?.question_time_remaining || 0);
        
        // FIXED: Don't reset quiz time remaining from backend
        // Let it continue counting down from the original start time
        
        setSelectedOption(null);

        // Update current question number
        setCurrentQuestionNumber(data.attempt_info?.current_question_number || 1);

        if (data.attempt_info?.question_started_at) {
            questionStartedAt.current = new Date(data.attempt_info.question_started_at);
        }

    } catch (error) {
        toast.error(error.message || 'Failed to load question. Please refresh the page.');
    } finally {
        if (hasStarted) setLoading(false);
    }
};


   const submitCurrentAnswer = useCallback(async (autoSubmit = false) => {
    // Prevent multiple submissions
    if (!currentQuestion || !attempt || isFinalized || submitting) return;

    setSubmitting(true);

    try {
        const timeTaken = questionStartedAt.current ? 
            Math.floor((Date.now() - questionStartedAt.current.getTime()) / 1000) : 
            Math.max(0, (currentQuestion.time_limit_seconds || 60) - timeRemaining);

        const submitData = {
            question_id: currentQuestion.id,
            selected_option_id: selectedOption,
            client_start_time: questionStartedAt.current?.toISOString() || new Date().toISOString(),
            time_taken: Math.max(0, timeTaken),
            auto_submit: autoSubmit
        };

        const response = await apiRequest(`/api/quiz-attempts/${attempt.id}/answer`, {
            method: 'POST',
            body: JSON.stringify(submitData)
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorMessage = 'Failed to submit answer';
            
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                    
                    if (errorData.errors) {
                        const validationErrors = Object.values(errorData.errors).flat();
                        errorMessage = validationErrors.join(', ') || errorMessage;
                    }
                } catch (jsonError) {
                    // Continue with default message
                }
            } else {
                if (responseText.includes('Page Expired') || responseText.includes('419') || response.status === 419) {
                    errorMessage = 'Your session has expired. Please refresh the page and log in again.';
                } else if (responseText.includes('CSRF') || responseText.includes('token mismatch')) {
                    errorMessage = 'Security token expired. Please refresh the page.';
                } else if (response.status === 404) {
                    errorMessage = 'Quiz API endpoint not found. Please contact support.';
                } else if (response.status === 403) {
                    errorMessage = 'Access denied. You may not be authorized to take this quiz.';
                } else if (response.status === 422) {
                    errorMessage = 'Invalid submission data. Please try again.';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again in a few moments.';
                }
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();

        if (result.success) {
            // Only show messages for auto-submit scenarios
            if (autoSubmit) {
                if (selectedOption) {
                    toast("⏰ Time expired - Your selected answer was submitted", {
                        duration: 3000,
                        style: {
                            background: '#3b82f6',
                            color: 'white',
                        },
                    });
                } else {
                    toast("⏰ Time expired - Question skipped", {
                        duration: 3000,
                        style: {
                            background: '#f59e0b',
                            color: 'white',
                        },
                    });
                }
            } else {
                toast.success('Answer submitted!');
            }

            // FIXED: Check if this was the last question and finalize
            if (currentQuestionNumber >= totalQuestions) {
                // This was the last question - finalize the quiz
                await finalizeQuiz();
                return;
            }

            // Load next question
            setTimeout(() => {
                loadCurrentQuestion();
            }, autoSubmit ? 200 : 1000);

        } else {
            throw new Error(result.message || 'Server rejected the submission');
        }

    } catch (error) {
        // Handle "already submitted" errors gracefully
        if (error.message.includes('already submitted') || error.message.includes('duplicate')) {
            console.warn('Question already submitted, moving to next question');
            // Just move to next question without showing error
            setTimeout(() => {
                loadCurrentQuestion();
            }, 500);
            return;
        }

        if (error.message.includes('expired') || error.message.includes('session') || error.message.includes('token')) {
            toast.error('⚠️ ' + error.message);
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else if (error.message.includes('not found')) {
            toast.error('❌ ' + error.message);
            setTimeout(() => {
                handleNavigation('/dashboard/quizzes');
            }, 3000);
        } else {
            toast.error('❌ ' + (error.message || 'Failed to submit answer'));
            
            if (!error.message.includes('expired') && !error.message.includes('token')) {
                setTimeout(() => {
                    loadCurrentQuestion();
                }, 2000);
            }
        }
    } finally {
        setSubmitting(false);
    }
}, [currentQuestion, attempt, isFinalized, submitting, selectedOption, timeRemaining, currentQuestionNumber, totalQuestions]);


    // FIXED: Skip answer function - simplified, no API call
    const skipCurrentAnswer = async () => {
    if (!currentQuestion || !attempt || isFinalized || submitting) return;

    setSubmitting(true);

    try {
        const timeTaken = questionStartedAt.current ? 
            Math.floor((Date.now() - questionStartedAt.current.getTime()) / 1000) : 0;

        const submitData = {
            question_id: currentQuestion.id,
            selected_option_id: null,
            client_start_time: questionStartedAt.current?.toISOString() || new Date().toISOString(),
            time_taken: Math.max(0, timeTaken),
            auto_submit: false,
            is_skipped: true
        };

        const response = await apiRequest(`/api/quiz-attempts/${attempt.id}/answer`, {
            method: 'POST',
            body: JSON.stringify(submitData)
        });

        if (!response.ok) {
            throw new Error('Failed to skip question');
        }

        const result = await response.json();

        if (result.success) {
            toast.success('Question skipped');
            
            // FIXED: Check if this was the last question and finalize
            if (currentQuestionNumber >= totalQuestions) {
                // This was the last question - finalize the quiz
                await finalizeQuiz();
                return;
            }

            // Move to next question
            setTimeout(() => {
                loadCurrentQuestion();
            }, 500);
        } else {
            throw new Error(result.message || 'Server rejected skip request');
        }
    } catch (error) {
        toast.error(`Failed to skip question: ${error.message}`);
    } finally {
        setSubmitting(false);
    }
};

const finalizeQuiz = async () => {
    if (!attempt || isFinalized) return;

    setIsFinalized(true);

    try {
        // Try to get the next question - if no more questions, backend will finalize
        const response = await apiRequest(`/api/quiz-attempts/${attempt.id}/question`);
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data?.completed) {
                // Quiz is completed and finalized by backend
                toast.success('🎉 Quiz completed! Redirecting to results...');
                
                setTimeout(() => {
                    handleNavigation(`/dashboard/quizzes/results/${attempt.id}`);
                }, 2000);
                return;
            }
        }
        
        // If the above doesn't work, redirect anyway (results page will handle finalization)
        toast.success('🎉 Quiz completed! Redirecting to results...');
        setTimeout(() => {
            handleNavigation(`/dashboard/quizzes/results/${attempt.id}`);
        }, 2000);
        
    } catch (error) {
        // Even if there's an error, redirect to results
        toast.success('🎉 Quiz completed! Redirecting to results...');
        setTimeout(() => {
            handleNavigation(`/dashboard/quizzes/results/${attempt.id}`);
        }, 2000);
    }
};


    const formatTime = (seconds) => {
        if (!seconds || seconds < 0 || isNaN(seconds)) return "00:00";

        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!mounted) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-4xl mx-auto">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Quiz</h2>
                    <p className="text-gray-600">Please wait...</p>
                </div>
            </div>
        );
    }

    if (initialLoading) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-4xl mx-auto">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Quiz</h2>
                    <p className="text-gray-600">Please wait while we prepare your quiz...</p>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-auto">
                    <div className="text-red-600 text-xl mb-4">❌</div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
                    <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist.</p>
                    <button
                        onClick={() => handleNavigation('/dashboard/quizzes')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    // Instructions step
    if (!attempt && currentStep === 'instructions') {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
                    <div className="border-b border-gray-200 px-8 py-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                        {quiz.description && (
                            <p className="text-gray-600 text-lg">{quiz.description}</p>
                        )}
                    </div>

                    <div className="px-8 py-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                                📋 Quiz Instructions
                            </h2>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                                <h3 className="font-semibold text-red-800 mb-4 flex items-center">
                                    ⚠️ Important Security Rules
                                </h3>
                                <ul className="space-y-2 text-red-700">
                                    <li className="flex items-start">
                                        <span className="mr-3 text-red-500">•</span>
                                        <strong>Do NOT switch tabs or leave this window</strong> - Quiz will be automatically terminated
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-red-500">•</span>
                                        <strong>Do NOT use browser developer tools</strong> - F12, Ctrl+Shift+I, etc. are blocked
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-red-500">•</span>
                                        <strong>Do NOT right-click or copy text</strong> - All context menus are disabled
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-red-500">•</span>
                                        <strong>Maintain focus on this window</strong> - Any violation will end your quiz immediately
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                                    ℹ️ General Guidelines
                                </h3>
                                <ul className="space-y-2 text-blue-700">
                                    <li className="flex items-start">
                                        <span className="mr-3 text-blue-500">•</span>
                                        Ensure you have a stable internet connection before starting
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-blue-500">•</span>
                                        Read each question carefully before selecting your answer
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-blue-500">•</span>
                                        Once you submit an answer, you cannot change it
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-blue-500">•</span>
                                        You can skip questions, but they will be marked as incorrect
                                    </li>
                                    {quiz.time_limit_minutes && (
                                        <li className="flex items-start">
                                            <span className="mr-3 text-blue-500">•</span>
                                            You have <strong>{quiz.time_limit_minutes} minutes</strong> total time for this quiz
                                        </li>
                                    )}
                                    {quiz.max_attempts > 0 && (
                                        <li className="flex items-start">
                                            <span className="mr-3 text-blue-500">•</span>
                                            You can attempt this quiz maximum <strong>{quiz.max_attempts} time(s)</strong>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                                    ✅ System Requirements
                                </h3>
                                <ul className="space-y-2 text-green-700">
                                    <li className="flex items-start">
                                        <span className="mr-3 text-green-500">•</span>
                                        Use a modern web browser (Chrome, Firefox, Safari, Edge)
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-green-500">•</span>
                                        JavaScript must be enabled
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-green-500">•</span>
                                        Stable internet connection required
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-3 text-green-500">•</span>
                                        Close unnecessary applications to ensure optimal performance
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <button
                                onClick={() => setCurrentStep('details')}
                                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-medium text-lg flex items-center space-x-2"
                            >
                                <span>I Understand - Continue</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz details page
    if (!attempt && currentStep === 'details') {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
                    <div className="border-b border-gray-200 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                                {quiz.description && (
                                    <p className="text-gray-600 text-lg">{quiz.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => setCurrentStep('instructions')}
                                className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                            >
                                <span>←</span>
                                <span>Back to Instructions</span>
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        {/* Quiz Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-blue-50 p-6 rounded-lg text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                    {totalQuestions}
                                </div>
                                <div className="text-sm text-blue-700 font-medium">Questions</div>
                            </div>

                            <div className="bg-purple-50 p-6 rounded-lg text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">
                                    {quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : 'No'}
                                </div>
                                <div className="text-sm text-purple-700 font-medium">Time Limit</div>
                            </div>

                            <div className="bg-green-50 p-6 rounded-lg text-center">
                                <div className="text-3xl font-bold text-green-600 mb-2">
                                    {quiz.passing_score_percentage || 70}%
                                </div>
                                <div className="text-sm text-green-700 font-medium">Passing Score</div>
                            </div>

                            <div className="bg-orange-50 p-6 rounded-lg text-center">
                                <div className="text-3xl font-bold text-orange-600 mb-2">
                                    {quiz.max_attempts === 0 ? '∞' : quiz.max_attempts}
                                </div>
                                <div className="text-sm text-orange-700 font-medium">Max Attempts</div>
                            </div>
                        </div>

                        {/* Registration Section */}
                        {quiz.requires_registration && (
                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 mb-8">
                                <h3 className="text-xl font-semibold text-center mb-6 flex items-center justify-center">
                                    🎓 Registration Required
                                </h3>

                                {user && (
                                    <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-3">Registering as:</p>
                                        <div className="flex items-center justify-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-blue-600 font-medium">
                                                    {user.name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center">
                                    {isRegistered ? (
                                        <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-800 rounded-full font-medium mb-4">
                                            ✅ You are registered for this quiz
                                        </div>
                                    ) : (
                                        <>
                                            <div className="inline-flex items-center px-6 py-3 bg-red-100 text-red-800 rounded-full font-medium mb-4">
                                                ❌ Not Registered
                                            </div>
                                            <div className="mb-4">
                                                <button
                                                    onClick={handleRegister}
                                                    disabled={registering}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto font-medium"
                                                >
                                                    {registering && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                                    <span>{registering ? 'Registering...' : 'Register for Quiz'}</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="text-center space-y-4">
                            <button
                                onClick={startQuiz}
                                disabled={loading || (quiz.requires_registration && !isRegistered)}
                                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg flex items-center justify-center space-x-2"
                            >
                                {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                                <span>
                                    {loading ? 'Starting Quiz...' :
                                        (quiz.requires_registration && !isRegistered) ? 'Registration Required to Start' :
                                            'Start Quiz'}
                                </span>
                            </button>

                            <button
                                onClick={() => handleNavigation('/dashboard/quizzes')}
                                className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 font-medium"
                            >
                                ← Back to Quizzes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading question
    if (loading && hasStarted) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-4xl mx-auto">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading next question...</p>
                </div>
            </div>
        );
    }

    // No current question
    if (!currentQuestion) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-4xl mx-auto">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Preparing quiz...</p>
                </div>
            </div>
        );
    }

    // Main quiz interface
    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Time Warning */}
            {showTimeWarning && (
                <div className="fixed top-20 right-6 z-50 animate-pulse">
                    <div className={`px-6 py-3 rounded-lg font-medium text-white shadow-lg ${warningMessage.includes('5 minutes') ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                        {warningMessage}
                    </div>
                </div>
            )}

            {/* Header with timers and progress */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-6">
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Question Time</div>
                            <div className={`text-xl font-bold ${timeRemaining <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                                {formatTime(timeRemaining)}
                            </div>
                        </div>
                        {quizTimeRemaining && (
                            <div className="text-center">
                                <div className="text-sm text-gray-600">Total Time</div>
                                <div className={`text-xl font-bold ${quizTimeRemaining <= 60 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                                    {formatTime(quizTimeRemaining)}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Progress</div>
                        <div className="text-lg font-semibold">
                            Question {currentQuestionNumber} of {totalQuestions}
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${(currentQuestionNumber / totalQuestions) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {currentQuestion.question_text}
                    </h2>

                    {currentQuestion.question_image && (
                        <div className="mb-4">
                            <img
                                src={currentQuestion.question_image}
                                alt="Question"
                                className="max-w-full h-auto rounded-lg border"
                            />
                        </div>
                    )}

                    {currentQuestion.code_snippet && (
                        <div className="bg-gray-100 rounded-lg p-4 mb-4">
                            <pre className="text-sm overflow-x-auto">
                                <code>{currentQuestion.code_snippet}</code>
                            </pre>
                        </div>
                    )}
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {currentQuestion.options?.map((option) => (
                        <label
                            key={option.id}
                            className={`block p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedOption === option.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'
                                }`}
                        >
                            <div className="flex items-start">
                                <input
                                    type="radio"
                                    name="answer"
                                    value={option.id}
                                    checked={selectedOption === option.id}
                                    onChange={() => setSelectedOption(option.id)}
                                    className="mr-3 mt-1"
                                    disabled={submitting}
                                />
                                <div className="flex-1">
                                    <span className="text-gray-800">{option.option_text}</span>
                                    {option.option_image && (
                                        <div className="mt-2">
                                            <img
                                                src={option.option_image}
                                                alt={`Option ${option.id}`}
                                                className="max-w-32 h-auto rounded border"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </label>
                    )) || <p className="text-gray-500">No options available</p>}
                </div>

                {/* Action buttons with skip */}
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Points: {currentQuestion.points || 1}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={skipCurrentAnswer}
                            disabled={submitting}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Skip
                        </button>
                        <button
                            onClick={() => submitCurrentAnswer(false)}
                            disabled={submitting || !selectedOption}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            <span>{submitting ? 'Submitting...' : 'Submit Answer'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizTaker;
