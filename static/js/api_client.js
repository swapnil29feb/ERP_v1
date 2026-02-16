// Stateless Functional API Client for Lighting ERP
const API_BASE_URL = '/api';

/**
 * Functional token retrieval (Stateless)
 */
const getToken = () => localStorage.getItem('access_token');

/**
 * Functional CSRF retrieval (Stateless)
 */
const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

/**
 * Core stateless request function
 */
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const csrfToken = getCSRFToken();
    const headers = { ...options.headers };

    // Automatic content-type for non-FormData
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrfToken) headers['X-CSRFToken'] = csrfToken;

    const method = options.method || 'GET';
    const url = `${API_BASE_URL}${endpoint}`;
    const body = isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined);

    console.log("API REQUEST:", method, url, headers, body);

    const config = {
        ...options,
        headers,
        body
    };

    try {
        const response = await fetch(url, config);
        console.log("API RESPONSE:", response.status);

        // Explicit 401 Handling
        if (response.status === 401) {
            console.error('Session expired (401). Redirecting to login.');
            localStorage.removeItem('access_token');
            window.location.href = '/login/';
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`API Failure [${response.status}] ${endpoint}:`, errorData);

            const error = new Error(`HTTP ${response.status}`);
            error.response = { status: response.status, data: errorData };
            throw error;
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        if (error.response) throw error; // Already enriched
        console.error(`Network or Parsing Error at ${endpoint}:`, error);
        throw error;
    }
};

/**
 * Functional mapping for the global API object (Backwards Compatible)
 */
const API = {
    baseURL: API_BASE_URL,
    getToken: getToken,
    getCSRFToken: getCSRFToken,
    request: apiRequest,

    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
    post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: data }),
    put: (endpoint, data) => apiRequest(endpoint, { method: 'PUT', body: data }),
    patch: (endpoint, data) => apiRequest(endpoint, { method: 'PATCH', body: data }),
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),

    getCurrentUser: () => API.get('/common/me/'),

    projects: {
        list: () => {
            return API.get('/projects/projects/').then(response => {
                // ✅ DRF may return array directly or wrapped in pagination
                // Normalize to always return array
                if (Array.isArray(response)) {
                    return response;
                } else if (response && response.results && Array.isArray(response.results)) {
                    return response.results;
                } else if (response && typeof response === 'object') {
                    console.warn("Unexpected projects response format:", response);
                    return [];
                }
                return [];
            });
        },
        get: (id) => API.get(`/projects/projects/${id}/`),
        create: (data) => API.post('/projects/projects/', data),
        update: (id, data) => API.put(`/projects/projects/${id}/`, data),
        delete: (id) => API.delete(`/projects/projects/${id}/`)
    },

    areas: {
        list: (projectId) => {
            return API.get(`/projects/areas/?project=${projectId}`).then(response => {
                if (Array.isArray(response)) return response;
                if (response && response.results && Array.isArray(response.results)) return response.results;
                console.warn("Unexpected areas response:", response);
                return [];
            });
        },
        get: (areaId) => API.get(`/projects/areas/${areaId}/`),
        create: (data) => API.post(`/projects/areas/`, data)
    },

    subareas: {
        list: (areaId) => {
            return API.get(`/projects/subareas/?area_id=${areaId}`).then(response => {
                if (Array.isArray(response)) return response;
                if (response && response.results && Array.isArray(response.results)) return response.results;
                console.warn("Unexpected subareas response:", response);
                return [];
            });
        },
        get: (saId) => API.get(`/projects/subareas/${saId}/`),
        create: (data) => API.post(`/projects/subareas/`, data)
    },

    products: {
        list: (projectId, areaId) => API.get(`/configurations/projects/${projectId}/areas/${areaId}/products/`),
        create: (projectId, areaId, data) => API.post(`/configurations/projects/${projectId}/areas/${areaId}/products/`, data)
    },

    configurations: {
        list: (subareaId) => {
            return API.get(`/configurations/?subarea=${subareaId}`).then(response => {
                if (Array.isArray(response)) return response;
                if (response && response.results && Array.isArray(response.results)) return response.results;
                console.warn("Unexpected configurations response:", response);
                return [];
            });
        },
        get: (configId) => API.get(`/configurations/${configId}/`),
        create: (data) => API.post('/configurations/', data),
        update: (configId, data) => API.put(`/configurations/${configId}/`, data),
        delete: (configId) => API.delete(`/configurations/${configId}/`),

        addDriver: (data) => API.post('/configurations/configuration-drivers/', data),
        addAccessory: (data) => API.post('/configurations/configuration-accessories/', data)
    },

    // ========== BOQ ITEMS (DIRECT BOQ MODE ONLY) ==========
    boqItems: {
        list: (projectId) => {
            return API.get(`/boq-items/?project=${projectId}`).then(response => {
                if (Array.isArray(response)) return response;
                if (response && response.results && Array.isArray(response.results)) return response.results;
                console.warn("Unexpected boqItems response:", response);
                return [];
            });
        },
        create: (data) => API.post('/boq-items/', data),
        update: (itemId, data) => API.put(`/boq-items/${itemId}/`, data),
        delete: (itemId) => API.delete(`/boq-items/${itemId}/`)
    },

    boq: {
        get: (projectId) => API.get(`/boq/projects/${projectId}/`),
        generate: (projectId) => API.post(`/boq/projects/${projectId}/generate/`),
        export: (projectId, format) => {
            const token = getToken();
            window.open(`${API_BASE_URL}/boq/export/${format}/${projectId}/?token=${token}`, '_blank');
        }
    }
};

// Global export
window.API = API;
