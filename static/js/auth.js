const API_BASE_URL = 'http://127.0.0.1:8000/api/';

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login/';
}

async function login(username, password) {
    try {
        // Use originalFetch to avoid intercepting our own login call with bad tokens if any
        // But our interceptor handles logic. 
        // Let's just use the global fetch which is patched.

        const response = await fetch(`${API_BASE_URL}auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.access) {
                localStorage.setItem('access_token', data.access);
                if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
                window.location.href = '/';
            } else {
                throw new Error('No access token received');
            }
        } else {
            const errorData = await response.json();
            const msg = errorData.detail || 'Login failed';
            const errorEl = document.getElementById('error-message');
            if (errorEl) {
                errorEl.textContent = msg;
                errorEl.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Login Error:', error);
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = 'An error occurred during login. Please checks your connection.';
            errorEl.style.display = 'block';
        }
    }
}

// Intercept fetch calls
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
    let url = input;
    if (input instanceof Request) {
        url = input.url;
    }

    // Convert relative URLs to absolute if needed, or check if it matches API
    // We assume backend is same origin or absolute URL provided.
    // The user requirement says usage of "http://127.0.0.1:8000/api/" which implies absolute.

    // Check if it's an API call
    if (String(url).includes('/api/')) {
        const token = getAccessToken();
        if (token) {
            init = init || {};
            init.headers = init.headers || {};

            // Handle Headers object or plain object
            if (init.headers instanceof Headers) {
                init.headers.set('Authorization', `Bearer ${token}`);
            } else if (Array.isArray(init.headers)) {
                // headers can be array of arrays
                init.headers.push(['Authorization', `Bearer ${token}`]);
            } else {
                init.headers['Authorization'] = `Bearer ${token}`;
            }
        }
    }

    try {
        const response = await originalFetch(input, init);

        // Handle 401 Unauthorized
        if (response.status === 401) {
            // Check if this was a login attempt
            const isLoginRequest = String(url).includes('/auth/login/');
            if (!isLoginRequest && window.location.pathname !== '/login/') {
                logout();
            }
        }
        return response;
    } catch (error) {
        throw error;
    }
};
