'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ImageUploader from './ImageUploader';

const QuestionBuilder = ({ question = null, onSave, onCancel, loading = false }) => {
    const [formData, setFormData] = useState({
        question_text: '',
        question_image: '',
        code_snippet: '',
        explanation: '',
        points: 1,
        time_limit_seconds: 30,
        options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false }
        ]
    });

    useEffect(() => {
        if (question) {
            setFormData({
                question_text: question.question_text || '',
                question_image: question.question_image || '',
                code_snippet: question.code_snippet || '',
                explanation: question.explanation || '',
                points: question.points || 1,
                time_limit_seconds: question.time_limit_seconds || 30,
                options: question.options?.length > 0 ? question.options.map(opt => ({
                    id: opt.id,
                    option_text: opt.option_text || '',
                    is_correct: opt.is_correct || false
                })) : [
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false }
                ]
            });
        } else {
            // Reset form for new question
            setFormData({
                question_text: '',
                question_image: '',
                code_snippet: '',
                explanation: '',
                points: 1,
                time_limit_seconds: 30,
                options: [
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false }
                ]
            });
        }
    }, [question]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!formData.question_text.trim()) {
            toast.error('Question text is required');
            return;
        }

        // Check if at least 2 options have text
        const validOptions = formData.options.filter(opt => opt.option_text.trim());
        if (validOptions.length < 2) {
            toast.error('At least 2 options are required');
            return;
        }

        // Check if exactly one option is marked as correct
        const correctOptions = formData.options.filter(opt => opt.is_correct);
        if (correctOptions.length !== 1) {
            toast.error('Exactly one option must be marked as correct');
            return;
        }

        onSave(formData);
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        
        // If marking this option as correct, unmark others
        if (field === 'is_correct' && value === true) {
            newOptions.forEach((opt, i) => {
                if (i !== index) {
                    opt.is_correct = false;
                }
            });
        }
        
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        if (formData.options.length < 6) {
            setFormData({
                ...formData,
                options: [...formData.options, { option_text: '', is_correct: false }]
            });
        }
    };

    const removeOption = (index) => {
        if (formData.options.length > 2) {
            const newOptions = formData.options.filter((_, i) => i !== index);
            setFormData({ ...formData, options: newOptions });
        }
    };

    const handleQuestionImageUpload = (imageUrl) => {
        setFormData({ ...formData, question_image: imageUrl });
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                    {question ? 'Edit Question' : 'Add New Question'}
                </h2>
                <button
                    onClick={onCancel}
                    className="text-gray-600 hover:text-gray-800"
                >
                    ✕
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question Text */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                    </label>
                    <textarea
                        value={formData.question_text}
                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your question here..."
                        required
                    />
                </div>

                {/* Question Image - Compact Button Version */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Question Image (Optional)
                        </label>
                        <div className="flex items-center space-x-2">
                            <ImageUploader 
                                onUpload={handleQuestionImageUpload}
                                existingImage={formData.question_image}
                                size="button"
                            />
                            {formData.question_image && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, question_image: '' })}
                                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                                >
                                    Remove Image
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Image Preview */}
                    {formData.question_image && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <img 
                                src={formData.question_image} 
                                alt="Question" 
                                className="max-w-xs max-h-32 object-contain rounded"
                            />
                        </div>
                    )}
                </div>

                {/* Code Snippet */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code Snippet (Optional)
                    </label>
                    <textarea
                        value={formData.code_snippet}
                        onChange={(e) => setFormData({ ...formData, code_snippet: e.target.value })}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-gray-50"
                        placeholder="Paste code here..."
                    />
                    {formData.code_snippet && (
                        <div className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-sm font-mono overflow-x-auto">
                            <pre>{formData.code_snippet}</pre>
                        </div>
                    )}
                </div>

                {/* Points and Time Limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Points *
                        </label>
                        <input
                            type="number"
                            value={formData.points}
                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            min="1"
                            max="10"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Limit (seconds) *
                        </label>
                        <input
                            type="number"
                            value={formData.time_limit_seconds}
                            onChange={(e) => setFormData({ ...formData, time_limit_seconds: parseInt(e.target.value) })}
                            min="10"
                            max="300"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                {/* Options - Text Only */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Answer Options *
                        </label>
                        <button
                            type="button"
                            onClick={addOption}
                            disabled={formData.options.length >= 6}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Option
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.options.map((option, index) => (
                            <div key={index} className={`border rounded-lg p-4 ${
                                option.is_correct 
                                    ? 'border-green-300 bg-green-50' 
                                    : 'border-gray-200'
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="correct_option"
                                            checked={option.is_correct}
                                            onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                                            className="mr-2 text-green-600 focus:ring-green-500"
                                        />
                                        <span className={`font-medium text-sm ${
                                            option.is_correct ? 'text-green-700' : 'text-gray-700'
                                        }`}>
                                            Option {index + 1} {option.is_correct && '✓ (Correct Answer)'}
                                        </span>
                                    </label>
                                    {formData.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <textarea
                                    value={option.option_text}
                                    onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                                    rows={2}
                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        option.is_correct 
                                            ? 'border-green-300 bg-white' 
                                            : 'border-gray-300'
                                    }`}
                                    placeholder={`Enter option ${index + 1} text...`}
                                    required
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                        Select one option as the correct answer by clicking the radio button.
                    </div>
                </div>

                {/* Explanation */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Explanation (Optional)
                    </label>
                    <textarea
                        value={formData.explanation}
                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Explain why the correct answer is correct..."
                    />
                </div>

                {/* Form Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Question Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Points:</span>
                            <span className="ml-1 font-semibold">{formData.points}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Time:</span>
                            <span className="ml-1 font-semibold">{formData.time_limit_seconds}s</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Options:</span>
                            <span className="ml-1 font-semibold">{formData.options.length}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Correct:</span>
                            <span className="ml-1 font-semibold text-green-600">
                                {formData.options.findIndex(opt => opt.is_correct) + 1 || 'None'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                    >
                        {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                        <span>{loading ? 'Saving...' : question ? 'Update Question' : 'Add Question'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuestionBuilder;
