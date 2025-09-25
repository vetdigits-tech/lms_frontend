'use client';

import React from 'react';

const QuizAccessDenied = ({ quiz, registrationInfo, onNavigateToQuizzes }) => {
    const parseDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return null;
        try {
            return new Date(dateTimeStr);
        } catch (error) {
            console.error('Error parsing date:', dateTimeStr, error);
            return null;
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
                <div className="border-b border-gray-200 px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                    {quiz.description && (
                        <p className="text-gray-600 text-lg">{quiz.description}</p>
                    )}
                </div>
                
                <div className="px-8 py-8 text-center">
                    <div className="text-red-600 text-6xl mb-6">🚫</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    
                    {registrationInfo.status === 'closed' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                            <h3 className="font-semibold text-red-800 mb-2">Registration Closed</h3>
                            <p className="text-red-700">
                                The registration period for this quiz has ended. You can no longer register or access this quiz.
                            </p>
                            {quiz.hasregistrationtimelimit && (
                                <div className="mt-4 text-sm text-red-600">
                                    <p><strong>Registration Period:</strong></p>
                                    <p>
                                        {parseDateTime(quiz.registrationstarttime)?.toLocaleDateString('en-US', {
                                            month: 'numeric',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })} {parseDateTime(quiz.registrationstarttime)?.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })} - {parseDateTime(quiz.registrationendtime)?.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {registrationInfo.status === 'notstarted' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                            <h3 className="font-semibold text-yellow-800 mb-2">Registration Not Open Yet</h3>
                            <p className="text-yellow-700 mb-4">
                                Registration for this quiz hasn't started yet.
                            </p>
                            <p className="text-yellow-600 font-medium">{registrationInfo.subtitle}</p>
                        </div>
                    )}
                    
                    <button
                        onClick={onNavigateToQuizzes}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Back to Quiz List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizAccessDenied;
