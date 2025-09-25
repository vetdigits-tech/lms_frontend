const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper functions for authentication
export const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
};

export const getCsrfToken = async () => {
    try {
        await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
    } catch (err) {
        console.error('Failed to get CSRF token:', err);
    }
};

export const getAuthHeaders = async (includeContentType = true) => {
    await getCsrfToken();
    const xsrfToken = getCookie('XSRF-TOKEN');
    
    const headers = {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': xsrfToken,
    };
    
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
};

export const apiRequest = async (url, options = {}) => {
    const headers = await getAuthHeaders(!options.formData);
    
    return fetch(`${API_URL}${url}`, {
        credentials: 'include',
        headers: options.formData ? {
            'Accept': 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
        } : headers,
        ...options
    });
};
