'use client';

import React from 'react';

const QuizDetails = ({ 
    quiz, 
    user, 
    isRegistered, 
    registering, 
    canStart,
    loading,
    statusInfo,
    registrationInfo,
    onRegister, 
    onStart, 
    onBack,
    onNavigateToQuizzes 
}) => {
    // Function to show popup when trying to interact with ended elements
    const showNoQuestionsPopup = () => {
        alert('This quiz has no questions available and cannot be taken.');
    };

    // Get question count from various possible fields
    const getQuestionCount = () => {
        return quiz.questionscount || 
               quiz.totalquestions || 
               quiz.questions_count || 
               quiz.total_questions || 
               0;
    };

    const questionCount = getQuestionCount();
    const hasNoQuestions = questionCount === 0;

    // Handle start quiz with validation
    const handleStartQuiz = () => {
        if (hasNoQuestions) {
            showNoQuestionsPopup();
            return;
        }
        
        onStart();
    };

    // Simplified registration check - just based on isRegistered prop
    const getSimpleRegistrationStatus = () => {
        if (!quiz.requiresregistration && !quiz.requires_registration) {
            return { status: 'not_required' };
        }
        
        if (isRegistered) {
            return {
                status: 'registered',
                message: 'Registered Successfully',
                color: 'green'
            };
        }
        
        return {
            status: 'open',
            message: 'Registration Required',
            subtitle: 'Register to take this quiz',
            color: 'blue',
            canRegister: true
        };
    };

    const simpleRegistrationInfo = getSimpleRegistrationStatus();

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
                {/* Header */}
                <div className="border-b border-gray-200 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                            {quiz.description && (
                                <p className="text-gray-600 text-lg">{quiz.description}</p>
                            )}
                        </div>
                        <button
                            onClick={onBack}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                        >
                            <span>←</span>
                            <span>Back to Instructions</span>
                        </button>
                    </div>
                </div>

                <div className="px-8 py-8">
                    {/* No Questions Warning */}
                    {hasNoQuestions && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                            <div className="flex items-center text-red-800">
                                <span className="text-2xl mr-3">⚠️</span>
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Quiz Not Available</h3>
                                    <p className="text-red-700">
                                        This quiz has no questions available and cannot be taken at this time.
                                        Please contact your administrator.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* **REMOVED: Quiz Status Display - no more scheduling info** */}
                    <div className="text-center mb-8">
                        <div className="inline-block px-6 py-3 rounded-full text-sm font-medium mb-4 bg-green-100 text-green-800">
                            {hasNoQuestions && <span className="mr-2">⚠️</span>}
                            Available now
                        </div>
                    </div>

                    {/* Quiz Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className={`p-6 rounded-lg text-center ${
                            hasNoQuestions ? 'bg-gray-100 opacity-60' : 'bg-blue-50'
                        }`}>
                            <div className={`text-3xl font-bold mb-2 ${
                                hasNoQuestions ? 'text-red-600' : 'text-blue-600'
                            }`}>
                                {questionCount}
                            </div>
                            <div className={`text-sm font-medium ${
                                hasNoQuestions ? 'text-gray-500' : 'text-blue-700'
                            }`}>Questions</div>
                            {hasNoQuestions && (
                                <div className="text-xs text-red-500 mt-1">No questions!</div>
                            )}
                        </div>
                        <div className={`p-6 rounded-lg text-center ${
                            hasNoQuestions ? 'bg-gray-100 opacity-60' : 'bg-purple-50'
                        }`}>
                            <div className={`text-3xl font-bold mb-2 ${
                                hasNoQuestions ? 'text-gray-500' : 'text-purple-600'
                            }`}>
                                {(quiz.timelimitminutes || quiz.time_limit_minutes) ? 
                                 `${quiz.timelimitminutes || quiz.time_limit_minutes}m` : 'No'}
                            </div>
                            <div className={`text-sm font-medium ${
                                hasNoQuestions ? 'text-gray-500' : 'text-purple-700'
                            }`}>Time Limit</div>
                        </div>
                        <div className={`p-6 rounded-lg text-center ${
                            hasNoQuestions ? 'bg-gray-100 opacity-60' : 'bg-green-50'
                        }`}>
                            <div className={`text-3xl font-bold mb-2 ${
                                hasNoQuestions ? 'text-gray-500' : 'text-green-600'
                            }`}>
                                {quiz.passingscorepercentage || quiz.passing_score_percentage || 70}%
                            </div>
                            <div className={`text-sm font-medium ${
                                hasNoQuestions ? 'text-gray-500' : 'text-green-700'
                            }`}>Passing Score</div>
                        </div>
                        <div className={`p-6 rounded-lg text-center ${
                            hasNoQuestions ? 'bg-gray-100 opacity-60' : 'bg-orange-50'
                        }`}>
                            <div className={`text-3xl font-bold mb-2 ${
                                hasNoQuestions ? 'text-gray-500' : 'text-orange-600'
                            }`}>
                                {(quiz.maxattempts || quiz.max_attempts) > 0 ? 
                                 (quiz.maxattempts || quiz.max_attempts) : '∞'}
                            </div>
                            <div className={`text-sm font-medium ${
                                hasNoQuestions ? 'text-gray-500' : 'text-orange-700'
                            }`}>Max Attempts</div>
                        </div>
                    </div>

                    {/* Simplified Registration Section */}
                    {(quiz.requiresregistration || quiz.requires_registration) && (
                        <div className={`border-2 border-dashed rounded-lg p-6 mb-8 ${
                            hasNoQuestions ? 'border-gray-300 bg-gray-50 opacity-60' : 'border-blue-300'
                        }`}>
                            <h3 className={`text-xl font-semibold text-center mb-6 flex items-center justify-center ${
                                hasNoQuestions ? 'text-gray-500' : ''
                            }`}>
                                📝 Registration Required
                                {hasNoQuestions && (
                                    <span className="ml-2 text-red-500">(Unavailable)</span>
                                )}
                            </h3>

                            {user && (
                                <div className={`text-center mb-6 p-4 rounded-lg ${
                                    hasNoQuestions ? 'bg-gray-100' : 'bg-gray-50'
                                }`}>
                                    <p className={`text-sm mb-3 ${
                                        hasNoQuestions ? 'text-gray-500' : 'text-gray-600'
                                    }`}>
                                        User:
                                    </p>
                                    <div className="flex items-center justify-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                            hasNoQuestions ? 'bg-gray-200' : 'bg-blue-100'
                                        }`}>
                                            <span className={`font-medium ${
                                                hasNoQuestions ? 'text-gray-500' : 'text-blue-600'
                                            }`}>
                                                {user.name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-medium ${
                                                hasNoQuestions ? 'text-gray-600' : 'text-gray-900'
                                            }`}>
                                                {user.name}
                                            </p>
                                            <p className={`text-sm ${
                                                hasNoQuestions ? 'text-gray-500' : 'text-gray-600'
                                            }`}>
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Simple Registration Status */}
                            {simpleRegistrationInfo.status === 'registered' ? (
                                <div className="text-center">
                                    <div className={`inline-flex items-center px-6 py-3 rounded-full font-medium mb-4 ${
                                        hasNoQuestions ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {hasNoQuestions ? '🔒' : '✅'} You are registered for this quiz
                                        {hasNoQuestions && <span className="ml-2">(No Questions)</span>}
                                    </div>
                                    <p className={`text-sm ${
                                        hasNoQuestions ? 'text-gray-500' : 'text-gray-600'
                                    }`}>
                                        {hasNoQuestions ? 'This quiz has no questions available' : 'You can start the quiz now'}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className={`inline-flex items-center px-6 py-3 rounded-full font-medium mb-4 ${
                                        hasNoQuestions ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {hasNoQuestions ? '🔒' : '📝'} 
                                        {hasNoQuestions ? 'Registration Closed' : simpleRegistrationInfo.message}
                                        {hasNoQuestions && <span className="ml-2">(No Questions)</span>}
                                    </div>
                                    {simpleRegistrationInfo.subtitle && !hasNoQuestions && (
                                        <p className="text-sm font-medium mb-4 text-blue-600">
                                            {simpleRegistrationInfo.subtitle}
                                        </p>
                                    )}
                                    <button
                                        onClick={hasNoQuestions ? showNoQuestionsPopup : onRegister}
                                        disabled={registering || hasNoQuestions}
                                        className={`${
                                            hasNoQuestions ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        } text-white px-8 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto font-medium`}
                                    >
                                        {registering && !hasNoQuestions && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        )}
                                        <span>
                                            {hasNoQuestions ? 'Unavailable' : registering ? 'Registering...' : 'Register for Quiz'}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="text-center space-y-4">
                        {(!(quiz.requiresregistration || quiz.requires_registration) || isRegistered) && (
                            <button
                                onClick={handleStartQuiz}
                                disabled={loading || hasNoQuestions}
                                className={`w-full py-4 px-6 rounded-lg font-medium text-lg flex items-center justify-center space-x-2 ${
                                    hasNoQuestions
                                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-60' 
                                        : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {loading && !hasNoQuestions && (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                )}
                                <span>
                                    {hasNoQuestions ? '⚠️ No Questions Available' :
                                     loading ? 'Starting Quiz...' : 'Start Quiz'}
                                </span>
                            </button>
                        )}
                        
                        <button
                            onClick={onNavigateToQuizzes}
                            className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 font-medium"
                        >
                            Back to Quizzes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizDetails;
