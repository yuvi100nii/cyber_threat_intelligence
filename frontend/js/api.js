/**
 * API Utility Module
 * Handles all HTTP requests to the backend
 */

const API = {
    baseURL: '/api',
    token: null,

    // Initialize API with stored token
    init() {
        this.token = localStorage.getItem('crms_token');
    },

    // Set authorization token
    setToken(token) {
        this.token = token;
        localStorage.setItem('crms_token', token);
    },

    // Clear token (logout)
    clearToken() {
        this.token = null;
        localStorage.removeItem('crms_token');
        localStorage.removeItem('crms_user');
    },

    // Get stored user
    getUser() {
        const user = localStorage.getItem('crms_user');
        return user ? JSON.parse(user) : null;
    },

    // Set user data
    setUser(user) {
        localStorage.setItem('crms_user', JSON.stringify(user));
    },

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Convert body to JSON if it's an object
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        // Remove Content-Type for FormData
        if (config.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    this.clearToken();
                    window.location.reload();
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // HTTP Methods
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Upload file
    upload(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData
        });
    },

    // Auth endpoints
    auth: {
        login(credentials) {
            return API.post('/auth/login', credentials);
        },
        register(userData) {
            return API.post('/auth/register', userData);
        },
        getProfile() {
            return API.get('/auth/profile');
        },
        updateProfile(data) {
            return API.put('/auth/profile', data);
        },
        changePassword(data) {
            return API.put('/auth/change-password', data);
        },
        getUsers() {
            return API.get('/auth/users');
        },
        updateUserStatus(id, isActive) {
            return API.put(`/auth/users/${id}/status`, { is_active: isActive });
        }
    },

    // Crime endpoints
    crimes: {
        getAll(params = {}) {
            return API.get('/crimes', params);
        },
        getOne(id) {
            return API.get(`/crimes/${id}`);
        },
        create(data) {
            return API.post('/crimes', data);
        },
        update(id, data) {
            return API.put(`/crimes/${id}`, data);
        },
        delete(id) {
            return API.delete(`/crimes/${id}`);
        },
        linkCriminal(crimeId, data) {
            return API.post(`/crimes/${crimeId}/criminals`, data);
        },
        unlinkCriminal(crimeId, criminalId) {
            return API.delete(`/crimes/${crimeId}/criminals/${criminalId}`);
        },
        linkVictim(crimeId, data) {
            return API.post(`/crimes/${crimeId}/victims`, data);
        },
        unlinkVictim(crimeId, victimId) {
            return API.delete(`/crimes/${crimeId}/victims/${victimId}`);
        },
        addUpdate(crimeId, data) {
            return API.post(`/crimes/${crimeId}/updates`, data);
        }
    },

    // Criminal endpoints
    criminals: {
        getAll(params = {}) {
            return API.get('/criminals', params);
        },
        getOne(id) {
            return API.get(`/criminals/${id}`);
        },
        create(data) {
            return API.post('/criminals', data);
        },
        update(id, data) {
            return API.put(`/criminals/${id}`, data);
        },
        delete(id) {
            return API.delete(`/criminals/${id}`);
        },
        uploadPhoto(id, formData) {
            return API.upload(`/criminals/${id}/photo`, formData);
        }
    },

    // Victim endpoints
    victims: {
        getAll(params = {}) {
            return API.get('/victims', params);
        },
        getOne(id) {
            return API.get(`/victims/${id}`);
        },
        create(data) {
            return API.post('/victims', data);
        },
        update(id, data) {
            return API.put(`/victims/${id}`, data);
        },
        delete(id) {
            return API.delete(`/victims/${id}`);
        },
        linkToCrime(victimId, data) {
            return API.post(`/victims/${victimId}/link-crime`, data);
        }
    },

    // FIR endpoints
    fir: {
        getAll(params = {}) {
            return API.get('/fir', params);
        },
        getOne(id) {
            return API.get(`/fir/${id}`);
        },
        create(data) {
            return API.post('/fir', data);
        },
        update(id, data) {
            return API.put(`/fir/${id}`, data);
        },
        delete(id) {
            return API.delete(`/fir/${id}`);
        }
    },

    // Police endpoints
    police: {
        getOfficers(params = {}) {
            return API.get('/police/officers', params);
        },
        getOfficer(id) {
            return API.get(`/police/officers/${id}`);
        },
        assignToCase(data) {
            return API.post('/police/assign', data);
        },
        updateAssignment(id, data) {
            return API.put(`/police/assignments/${id}`, data);
        },
        removeAssignment(id) {
            return API.delete(`/police/assignments/${id}`);
        },
        getMyCases(params = {}) {
            return API.get('/police/my-cases', params);
        },
        updateCaseStatus(crimeId, status) {
            return API.put(`/police/cases/${crimeId}/status`, { status });
        },
        getDepartments() {
            return API.get('/police/departments');
        }
    },

    // Dashboard endpoints
    dashboard: {
        getStats() {
            return API.get('/dashboard/stats');
        },
        getCrimesByType() {
            return API.get('/dashboard/crimes-by-type');
        },
        getCrimesBySeverity() {
            return API.get('/dashboard/crimes-by-severity');
        },
        getRecentCrimes(limit = 5) {
            return API.get('/dashboard/recent-crimes', { limit });
        },
        getMonthlyTrends() {
            return API.get('/dashboard/monthly-trends');
        },
        getCrimesByLocation() {
            return API.get('/dashboard/crimes-by-location');
        },
        getOfficerWorkload() {
            return API.get('/dashboard/officer-workload');
        },
        getCriticalCases() {
            return API.get('/dashboard/critical-cases');
        },
        getFirStatus() {
            return API.get('/dashboard/fir-status');
        }
    }
};

// Initialize API on load
API.init();
