'use client';

import React, { useState, useEffect } from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render on server-side to prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-16 h-16'
    };

    const colorClasses = {
        blue: 'border-blue-600',
        white: 'border-white', 
        gray: 'border-gray-600'
    };

    const validSize = sizeClasses[size] || sizeClasses.medium;
    const validColor = colorClasses[color] || colorClasses.blue;

    return (
        <div 
            className={`animate-spin rounded-full ${validSize} border-b-2 ${validColor} inline-block`}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default LoadingSpinner;
