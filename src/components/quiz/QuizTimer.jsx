'use client';

import React from 'react';

const QuizTimer = ({ 
    timeRemaining, 
    quizTimeRemaining, 
    showTimeWarning, 
    warningMessage, 
    attempt 
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

    return (
        <>
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
                            Question {(attempt?.currentquestionnumber || 1)} of {(attempt?.totalquestions || attempt?.quiz?.questionscount)}
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
        </>
    );
};

export default QuizTimer;
