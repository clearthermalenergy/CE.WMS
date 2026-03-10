// ============================================
// API Client — Centralized fetch calls
// ============================================

// Use environment variable for API URL in production (e.g., Capacitor mobile apps).
// Fallback to '/api' for local Vite proxy
const BASE = import.meta.env.VITE_API_URL || '/api';

// Auth token management
let _authToken = localStorage.getItem('ce_wms_token') || null;

export function setAuthToken(token) {
    _authToken = token;
}

export function getAuthToken() {
    return _authToken;
}

async function request(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add auth token if available
    if (_authToken) {
        headers['Authorization'] = `Bearer ${_authToken}`;
    }

    const res = await fetch(`${BASE}${url}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Handle 401 — token expired or invalid
    if (res.status === 401 && !url.includes('/auth/')) {
        localStorage.removeItem('ce_wms_token');
        _authToken = null;
        window.location.reload();
        throw new Error('Session expired. Please login again.');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `API error ${res.status}`);
    }
    return res.json();
}

// ============================================
// Auth
// ============================================
export const loginUser = (email, password) => request('/auth/login', { method: 'POST', body: { email, password } });
export const fetchMe = () => request('/auth/me');

// ============================================
// Full data load
// ============================================
export const fetchAllData = () => request('/data');
export const resetData = () => request('/data/reset', { method: 'POST' });

// Current user
export const fetchCurrentUser = () => request('/current-user');
export const switchUser = (userId) => request('/current-user', { method: 'PUT', body: { userId } });

// Employees
export const fetchEmployees = () => request('/employees');
export const fetchEmployee = (id) => request(`/employees/${id}`);
export const createEmployee = (data) => request('/employees', { method: 'POST', body: data });
export const updateEmployee = (id, data) => request(`/employees/${id}`, { method: 'PUT', body: data });
export const deleteEmployee = (id) => request(`/employees/${id}`, { method: 'DELETE' });

// Tasks
export const fetchTasks = () => request('/tasks');
export const fetchTask = (id) => request(`/tasks/${id}`);
export const createTask = (data) => request('/tasks', { method: 'POST', body: data });
export const updateTask = (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: data });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' });

// Leads
export const fetchLeads = () => request('/leads');
export const fetchLead = (id) => request(`/leads/${id}`);
export const createLead = (data) => request('/leads', { method: 'POST', body: data });
export const updateLead = (id, data) => request(`/leads/${id}`, { method: 'PUT', body: data });
export const deleteLead = (id) => request(`/leads/${id}`, { method: 'DELETE' });

// Leaves
export const fetchLeaves = () => request('/leaves');
export const fetchLeave = (id) => request(`/leaves/${id}`);
export const createLeave = (data) => request('/leaves', { method: 'POST', body: data });
export const updateLeave = (id, data) => request(`/leaves/${id}`, { method: 'PUT', body: data });

// Leave balances
export const fetchLeaveBalances = () => request('/leave-balances');
export const fetchLeaveBalance = (empId) => request(`/leave-balances/${empId}`);

// Activities
export const fetchActivities = () => request('/activities');
export const createActivity = (data) => request('/activities', { method: 'POST', body: data });

// Notifications
export const fetchNotifications = () => request('/notifications');
export const createNotification = (data) => request('/notifications', { method: 'POST', body: data });
export const updateNotification = (id, data) => request(`/notifications/${id}`, { method: 'PUT', body: data });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'PUT' });
