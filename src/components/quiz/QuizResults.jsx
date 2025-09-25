'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { apiRequest } from '../../utils/auth';

const QuizResults = ({ attemptId }) => {
    const router = useRouter();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

    useEffect(() => {
        if (attemptId) {
            loadResults();
        }
    }, [attemptId]);

    const loadResults = async () => {
        try {
            const response = await apiRequest(`/api/quiz-attempts/${attemptId}/results`);
            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);
                setResults(data.data);
            } else {
                throw new Error('Failed to load results');
            }
        } catch (err) {
            setError(err.message);
            toast.error('Failed to load quiz results');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        let timeValue = seconds;
        
        if (typeof seconds === 'object' && seconds !== null) {
            timeValue = seconds.seconds || seconds.time_taken || seconds.duration || 0;
        }
        
        timeValue = Number(timeValue);
        
        if (isNaN(timeValue)) {
            return '0m 0s';
        }
        
        const totalSeconds = Math.abs(Math.floor(timeValue));
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getTimeValue = (results) => {
        return results.time_taken_seconds || 
               results.time_taken || 
               results.duration || 
               results.total_time || 
               results.elapsed_time || 
               0;
    };

    // Get question status and styling
    const getQuestionStatus = (answer) => {
        if (answer.is_skipped) {
            return {
                status: 'Skipped',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                textColor: 'text-yellow-800',
                icon: '⏭️'
            };
        }
        
        if (answer.is_correct) {
            return {
                status: 'Correct',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-800',
                icon: '✅'
            };
        }
        
        return {
            status: 'Wrong',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            icon: '❌'
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">Loading Results...</p>
                </div>
            </div>
        );
    }

    if (error || !results) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold mb-4">Failed to Load Results</h2>
                    <button 
                        onClick={() => router.push('/dashboard/quizzes')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    // ✅ FIXED: Always calculate from individual answers (ignore backend counts)
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;

    if (results.answers && results.answers.length > 0) {
        // Calculate from individual answers (most accurate)
        correctAnswers = results.answers.filter(a => a.is_correct === true).length;
        wrongAnswers = results.answers.filter(a => a.is_correct === false).length;
        skippedAnswers = results.answers.filter(a => a.is_skipped === true).length;
    } else {
        // Fallback to API values (less reliable)
        correctAnswers = results.correct_answers || 0;
        wrongAnswers = results.wrong_answers || 0;
        skippedAnswers = results.skipped_answers || 0;
    }

    const attemptedQuestions = correctAnswers + wrongAnswers;
    const totalQuestions = results.total_questions || 0;
    
    // Calculate percentage based on attempted questions only
    const displayPercentage = attemptedQuestions > 0 ? 
        Math.round((correctAnswers / attemptedQuestions) * 100) : 0;
    
    const isPassed = displayPercentage >= (results.passing_score || 70);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                
                {/* 📊 SECTION 1: MAIN RESULTS */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {results.quiz_title || 'Quiz Results'}
                        </h1>
                        
                        {/* Big Score */}
                        <div className="mb-6">
                            <div className={`text-7xl font-bold mb-3 ${
                                isPassed ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {displayPercentage}%
                            </div>
                            <div className={`text-2xl font-semibold ${
                                isPassed ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {isPassed ? 'PASSED ✅' : 'FAILED ❌'}
                            </div>
                        </div>

                        {/* Pass/Fail Message */}
                        <div className={`p-5 rounded-xl text-lg font-medium ${
                            isPassed 
                                ? 'bg-green-50 border-2 border-green-200 text-green-800' 
                                : 'bg-red-50 border-2 border-red-200 text-red-800'
                        }`}>
                            {isPassed 
                                ? `🎉 Congratulations! You passed with ${displayPercentage}%`
                                : `You need ${results.passing_score || 70}% to pass. You scored ${displayPercentage}%`
                            }
                            
                            {skippedAnswers > 0 && (
                                <div className="text-sm mt-2 opacity-80">
                                    Score based on {attemptedQuestions} attempted questions 
                                    ({skippedAnswers} skipped)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={`grid gap-6 ${
                        skippedAnswers > 0 
                            ? 'grid-cols-2 md:grid-cols-5' 
                            : 'grid-cols-2 md:grid-cols-4'
                    }`}>
                        <div className="text-center bg-blue-50 p-6 rounded-xl border-2 border-blue-100">
                            <div className="text-4xl font-bold text-blue-600 mb-2">{correctAnswers}</div>
                            <div className="text-blue-700 font-semibold">Correct</div>
                        </div>
                        
                        <div className="text-center bg-red-50 p-6 rounded-xl border-2 border-red-100">
                            <div className="text-4xl font-bold text-red-600 mb-2">{wrongAnswers}</div>
                            <div className="text-red-700 font-semibold">Wrong</div>
                        </div>
                        
                        {skippedAnswers > 0 && (
                            <div className="text-center bg-yellow-50 p-6 rounded-xl border-2 border-yellow-100">
                                <div className="text-4xl font-bold text-yellow-600 mb-2">{skippedAnswers}</div>
                                <div className="text-yellow-700 font-semibold">Skipped</div>
                            </div>
                        )}
                        
                        <div className="text-center bg-purple-50 p-6 rounded-xl border-2 border-purple-100">
                            <div className="text-4xl font-bold text-purple-600 mb-2">{totalQuestions}</div>
                            <div className="text-purple-700 font-semibold">Total Questions</div>
                        </div>
                        
                        <div className="text-center bg-green-50 p-6 rounded-xl border-2 border-green-100">
                            <div className="text-4xl font-bold text-green-600 mb-2">
                                {formatTime(getTimeValue(results))}
                            </div>
                            <div className="text-green-700 font-semibold">Time Taken</div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    {skippedAnswers > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="text-center text-sm text-gray-600">
                                <div className="font-semibold mb-1">Performance Summary:</div>
                                <div>
                                    <span className="text-blue-600 font-medium">{correctAnswers} Correct</span> • 
                                    <span className="text-red-600 font-medium"> {wrongAnswers} Wrong</span> • 
                                    <span className="text-yellow-600 font-medium"> {skippedAnswers} Skipped</span>
                                </div>
                                <div className="mt-1 text-xs">
                                    Final Score: {correctAnswers}/{attemptedQuestions} attempted questions = {displayPercentage}%
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 📝 SECTION 2: DETAILED QUESTION ANALYSIS */}
                <div className="bg-white rounded-xl shadow-lg mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                <span className="mr-3 text-3xl">📊</span>
                                Detailed Analysis
                            </h2>
                            <button
                                onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                    showDetailedAnalysis 
                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {showDetailedAnalysis ? 'Hide Details' : 'Show Details'}
                            </button>
                        </div>
                    </div>

                    {showDetailedAnalysis && results.answers && (
                        <div className="p-6">
                            <div className="space-y-6">
                                {results.answers.map((answer, index) => {
                                    const status = getQuestionStatus(answer);
                                    const correctOption = answer.question.options.find(opt => opt.is_correct);
                                    
                                    return (
                                        <div 
                                            key={answer.id} 
                                            className={`p-6 rounded-xl border-2 ${status.bgColor} ${status.borderColor}`}
                                        >
                                            {/* Question Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">{status.icon}</span>
                                                    <div>
                                                        <h3 className={`text-lg font-bold ${status.textColor}`}>
                                                            Question {index + 1} - {status.status}
                                                        </h3>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            Time taken: {formatTime(answer.time_taken_seconds)} • 
                                                            Points: {answer.points_earned}/{answer.question.points || 1}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Question Text */}
                                            <div className="mb-4">
                                                <p className="text-gray-900 font-medium leading-relaxed">
                                                    {answer.question.question_text}
                                                </p>
                                                
                                                {/* Question Image */}
                                                {answer.question.question_image && (
                                                    <div className="mt-3">
                                                        <img 
                                                            src={answer.question.question_image} 
                                                            alt="Question"
                                                            className="max-w-full h-auto rounded-lg border border-gray-200"
                                                        />
                                                    </div>
                                                )}

                                                {/* Code Snippet */}
                                                {answer.question.code_snippet && (
                                                    <div className="mt-3 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                                                        <pre className="text-sm font-mono">{answer.question.code_snippet}</pre>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Options Analysis */}
                                            {!answer.is_skipped && (
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-gray-900">Answer Options:</h4>
                                                    
                                                    {answer.question.options.map((option) => {
                                                        const isSelected = answer.selectedOption?.id === option.id;
                                                        const isCorrect = option.is_correct;
                                                        
                                                        let optionStyle = 'bg-gray-50 border-gray-200 text-gray-700';
                                                        let icon = '';
                                                        
                                                        if (isCorrect && isSelected) {
                                                            // Correct answer selected
                                                            optionStyle = 'bg-green-100 border-green-300 text-green-800';
                                                            icon = '✅';
                                                        } else if (isCorrect && !isSelected) {
                                                            // Correct answer not selected
                                                            optionStyle = 'bg-green-50 border-green-200 text-green-700';
                                                            icon = '✓';
                                                        } else if (!isCorrect && isSelected) {
                                                            // Wrong answer selected
                                                            optionStyle = 'bg-red-100 border-red-300 text-red-800';
                                                            icon = '❌';
                                                        }
                                                        
                                                        return (
                                                            <div 
                                                                key={option.id}
                                                                className={`p-3 rounded-lg border-2 ${optionStyle} flex items-start`}
                                                            >
                                                                <span className="text-lg mr-3 flex-shrink-0">{icon}</span>
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{option.option_text}</div>
                                                                    {option.option_image && (
                                                                        <img 
                                                                            src={option.option_image} 
                                                                            alt="Option"
                                                                            className="mt-2 max-w-xs h-auto rounded border"
                                                                        />
                                                                    )}
                                                                    {isSelected && (
                                                                        <div className="text-xs mt-1 font-semibold opacity-75">
                                                                            Your Answer
                                                                        </div>
                                                                    )}
                                                                    {isCorrect && !isSelected && (
                                                                        <div className="text-xs mt-1 font-semibold text-green-600">
                                                                            Correct Answer
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Skipped Question Message */}
                                            {answer.is_skipped && (
                                                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
                                                    <div className="text-yellow-800 font-medium">
                                                        ⏭️ You skipped this question
                                                    </div>
                                                    {correctOption && (
                                                        <div className="text-sm text-yellow-700 mt-2">
                                                            <strong>Correct answer was:</strong> {correctOption.option_text}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Explanation */}
                                            {answer.question.explanation && (
                                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <h5 className="font-semibold text-blue-900 mb-2">💡 Explanation:</h5>
                                                    <p className="text-blue-800 text-sm leading-relaxed">
                                                        {answer.question.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quick Summary when collapsed */}
                    {!showDetailedAnalysis && (
                        <div className="p-6 text-center text-gray-600">
                            <p className="mb-4">Click "Show Details" to see question-by-question analysis</p>
                            <div className="text-sm">
                                Review your answers, see correct solutions, and understand explanations
                            </div>
                        </div>
                    )}
                </div>

                {/* 📈 SECTION 3: PERFORMANCE INSIGHTS */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center">
                        <span className="mr-3 text-3xl">📈</span>
                        Performance Insights
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Accuracy Analysis */}
                        <div className="bg-gray-50 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Accuracy Analysis</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Questions Attempted:</span>
                                    <span className="font-semibold">{attemptedQuestions}/{totalQuestions}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Accuracy Rate:</span>
                                    <span className="font-semibold text-blue-600">{displayPercentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Skip Rate:</span>
                                    <span className="font-semibold text-yellow-600">
                                        {Math.round((skippedAnswers / totalQuestions) * 100)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Points Earned:</span>
                                    <span className="font-semibold text-green-600">
                                        {results.score || 0}/{results.total_possible_score || 0} pts
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Time Analysis */}
                        <div className="bg-gray-50 p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Time Analysis</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Time:</span>
                                    <span className="font-semibold">{formatTime(getTimeValue(results))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Avg. per Question:</span>
                                    <span className="font-semibold">
                                        {formatTime(Math.round(getTimeValue(results) / totalQuestions))}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Avg. per Attempt:</span>
                                    <span className="font-semibold">
                                        {attemptedQuestions > 0 ? formatTime(Math.round(getTimeValue(results) / attemptedQuestions)) : '0m 0s'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Quiz Status:</span>
                                    <span className={`font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPassed ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div className="flex flex-wrap justify-center gap-4">
                        <button 
                            onClick={() => router.push('/dashboard/quizzes')}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                        >
                            Back to Quizzes
                        </button>
                        {!isPassed && results.quiz?.id && (
                            <button 
                                onClick={() => router.push(`/dashboard/quizzes/${results.quiz.id}`)}
                                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold"
                            >
                                Retake Quiz
                            </button>
                        )}
                        <button 
                            onClick={() => window.print()}
                            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 font-semibold"
                        >
                            Print Results
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard/quizzes/leaderboard')}
                            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold"
                        >
                            View Leaderboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizResults;
