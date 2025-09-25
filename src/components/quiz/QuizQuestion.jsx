'use client';

import React from 'react';

const QuizQuestion = ({
    currentQuestion,
    selectedOption,
    submitting,
    onOptionSelect,
    onSubmit,
    attempt,
    timeRemaining,
    quizTimeRemaining,
    showTimeWarning,
    warningMessage
}) => {
    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0 || isNaN(seconds)) return '00:00';
        
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!currentQuestion) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading question...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Inline Time Warning */}
            {showTimeWarning && (
                <div className="fixed top-20 right-6 z-50 animate-pulse">
                    <div className={`px-6 py-3 rounded-lg font-medium text-white shadow-lg ${
                        warningMessage.includes('5 minutes') ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                        {warningMessage}
                    </div>
                </div>
            )}

            {/* Header with timers */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-6">
                        <div className="text-center">
                            <div className="text-sm text-gray-600">Question Time</div>
                            <div className={`text-xl font-bold ${
                                timeRemaining <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'
                            }`}>
                                {formatTime(timeRemaining)}
                            </div>
                        </div>
                        {quizTimeRemaining && (
                            <div className="text-center">
                                <div className="text-sm text-gray-600">Total Time</div>
                                <div className={`text-xl font-bold ${
                                    quizTimeRemaining <= 60 ? 'text-red-600 animate-pulse' : 'text-green-600'
                                }`}>
                                    {formatTime(quizTimeRemaining)}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center">
                        <div className="text-sm text-gray-600">Progress</div>
                        <div className="text-lg font-semibold">
                            Question {(attempt?.currentquestionnumber || 1)} of {(attempt?.totalquestions || attempt?.quiz?.questionscount || 0)}
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${((attempt?.currentquestionnumber || 1) / (attempt?.totalquestions || attempt?.quiz?.questionscount || 1)) * 100}%`
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
                        {currentQuestion.questiontext}
                    </h2>

                    {/* Question Image */}
                    {currentQuestion.questionimage && (
                        <div className="mb-4">
                            <img
                                src={currentQuestion.questionimage}
                                alt="Question"
                                className="max-w-full h-auto rounded-lg border"
                            />
                        </div>
                    )}

                    {/* Code Snippet */}
                    {currentQuestion.codesnippet && (
                        <div className="bg-gray-100 rounded-lg p-4 mb-4">
                            <pre className="text-sm overflow-x-auto">
                                <code>{currentQuestion.codesnippet}</code>
                            </pre>
                        </div>
                    )}
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {currentQuestion.options?.length ? (
                        currentQuestion.options.map((option) => (
                            <label
                                key={option.id}
                                className={`block p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedOption === option.id
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="flex items-start">
                                    <input
                                        type="radio"
                                        name="answer"
                                        value={option.id}
                                        checked={selectedOption === option.id}
                                        onChange={() => onOptionSelect(option.id)}
                                        className="mr-3 mt-1"
                                        disabled={submitting}
                                    />
                                    <div className="flex-1">
                                        <span className="text-gray-800">{option.optiontext}</span>
                                        {option.optionimage && (
                                            <div className="mt-2">
                                                <img
                                                    src={option.optionimage}
                                                    alt={`Option ${option.id}`}
                                                    className="max-w-32 h-auto rounded border"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </label>
                        ))
                    ) : (
                        <p className="text-gray-500">No options available</p>
                    )}
                </div>

                {/* Submit button */}
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Points: {currentQuestion.points || 1}
                    </div>
                    <button
                        onClick={() => onSubmit(false)}
                        disabled={submitting || !selectedOption}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {submitting && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        <span>{submitting ? 'Submitting...' : 'Submit Answer'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizQuestion;
