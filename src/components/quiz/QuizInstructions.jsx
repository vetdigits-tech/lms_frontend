'use client';

import React from 'react';

const QuizInstructions = ({ quiz, onContinue }) => {
    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
                {/* Header */}
                <div className="border-b border-gray-200 px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                    {quiz.description && (
                        <p className="text-gray-600 text-lg">{quiz.description}</p>
                    )}
                </div>

                {/* Instructions Section */}
                <div className="px-8 py-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                            📋 Quiz Instructions
                        </h2>

                        {/* Security Rules */}
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

                        {/* General Guidelines */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                                📝 General Guidelines
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
                                    Answer all questions - blank answers will be marked as incorrect
                                </li>
                                {quiz.timelimitminutes && (
                                    <li className="flex items-start">
                                        <span className="mr-3 text-blue-500">•</span>
                                        You have <strong>{quiz.timelimitminutes} minutes</strong> total time for this quiz
                                    </li>
                                )}
                                {quiz.maxattempts > 0 && (
                                    <li className="flex items-start">
                                        <span className="mr-3 text-blue-500">•</span>
                                        You can attempt this quiz maximum <strong>{quiz.maxattempts} times</strong>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* System Requirements */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                                💻 System Requirements
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

                    {/* Continue Button */}
                    <div className="flex items-center justify-center">
                        <button
                            onClick={onContinue}
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
};

export default QuizInstructions;
