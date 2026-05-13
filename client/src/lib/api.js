const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('casemap_token');
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    };

    // Inject auth token
    const token = getToken();
    if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const res = await fetch(url, config);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${res.status}`);
    }

    // Handle CSV downloads
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
        return res.blob();
    }

    return res.json();
}

// ----- Auth -----
export const register = (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const login = (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const getMe = () => request('/auth/me');

// ----- Cases -----
export const getCases = () => request('/cases');
export const getCase = (id) => request(`/cases/${id}`);
export const createCase = (data) => request('/cases', { method: 'POST', body: JSON.stringify(data) });
export const updateCase = (id, data) => request(`/cases/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCase = (id) => request(`/cases/${id}`, { method: 'DELETE' });

// ----- Documents -----
export const uploadDocuments = (caseId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return request(`/cases/${caseId}/documents`, { method: 'POST', body: formData });
};
export const getDocuments = (caseId) => request(`/cases/${caseId}/documents`);
export const getDocumentStatus = (id) => request(`/documents/${id}/status`);

// ----- Events -----
export const getEvents = (caseId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.search) params.set('search', filters.search);
    const query = params.toString();
    return request(`/cases/${caseId}/events${query ? `?${query}` : ''}`);
};
export const createEvent = (caseId, data) =>
    request(`/cases/${caseId}/events`, { method: 'POST', body: JSON.stringify(data) });
export const updateEvent = (id, data) =>
    request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEvent = (id) => request(`/events/${id}`, { method: 'DELETE' });

// ----- Timeline Export -----
export const exportTimeline = (caseId, format = 'json') =>
    request(`/cases/${caseId}/timeline/export?format=${format}`);
