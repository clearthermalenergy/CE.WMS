// ============================================
// Data Store — API-backed with local cache
// ============================================

import * as api from './api';

const avatarColors = [
  '#6366f1', '#8b5cf6', '#06d6a0', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#a855f7'
];

export function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Generate unique IDs (fallback for client-side, server generates real IDs)
let idCounter = Date.now();
export function generateId(prefix = '') {
  return `${prefix}${++idCounter}`;
}

// Date helpers
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

// ============================================
// Data Store (API-backed)
// ============================================

// Fallback defaults in case API is unreachable on first load
function getDefaultData() {
  return {
    employees: [],
    tasks: [],
    leads: [],
    leaves: [],
    leaveBalances: {},
    activities: [],
    notifications: [],
    rolePermissions: [],
    currentUser: 'EMP006',
  };
}

// Local cache
let _data = getDefaultData();
let _listeners = [];
let _initialized = false;

export const store = {
  getData() {
    return _data;
  },

  // Internal: update local cache and notify listeners
  _setLocal(updater) {
    if (typeof updater === 'function') {
      _data = updater(_data);
    } else {
      _data = { ..._data, ...updater };
    }
    _listeners.forEach(fn => fn(_data));
  },

  // Legacy setData — still works for local-only updates
  setData(updater) {
    this._setLocal(updater);
  },

  subscribe(listener) {
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter(fn => fn !== listener);
    };
  },

  // Initialize: load all data from the API
  async init() {
    if (_initialized) return _data;
    try {
      const data = await api.fetchAllData();
      _data = data;
      _initialized = true;
      _listeners.forEach(fn => fn(_data));
      return _data;
    } catch (err) {
      console.error('Failed to load data from API, using defaults:', err);
      _initialized = true;
      return _data;
    }
  },

  async reset() {
    try {
      await api.resetData();
      const data = await api.fetchAllData();
      _data = data;
      _listeners.forEach(fn => fn(_data));
    } catch (err) {
      console.error('Reset failed:', err);
    }
  },

  // Helper getters
  getEmployee(id) {
    return _data.employees.find(e => e.id === id);
  },

  getEmployeeName(id) {
    const emp = _data.employees.find(e => e.id === id);
    return emp ? emp.name : 'Unknown';
  },

  getCurrentUser() {
    return _data.employees.find(e => e.id === _data.currentUser);
  },

  // ============================================
  // Task operations (API-backed)
  // ============================================
  async addTask(task) {
    try {
      const newTask = await api.createTask({ ...task, createdBy: task.createdBy || _data.currentUser });
      // Refresh full data to pick up server-generated activity
      const data = await api.fetchAllData();
      this._setLocal(data);
      return newTask;
    } catch (err) {
      console.error('addTask failed:', err);
      // Fallback: optimistic local update
      const newTask = { ...task, id: generateId('TSK'), createdAt: new Date().toISOString(), comments: [], subtasks: task.subtasks || [] };
      this._setLocal(d => ({ ...d, tasks: [...d.tasks, newTask] }));
      return newTask;
    }
  },

  async updateTask(id, updates) {
    // Optimistic local update first
    this._setLocal(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
    try {
      await api.updateTask(id, updates);
    } catch (err) {
      console.error('updateTask failed:', err);
    }
  },

  async deleteTask(id) {
    this._setLocal(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
    try {
      await api.deleteTask(id);
    } catch (err) {
      console.error('deleteTask failed:', err);
    }
  },

  // ============================================
  // Lead operations (API-backed)
  // ============================================
  async addLead(lead) {
    try {
      const newLead = await api.createLead(lead);
      const data = await api.fetchAllData();
      this._setLocal(data);
      return newLead;
    } catch (err) {
      console.error('addLead failed:', err);
      const newLead = { ...lead, id: generateId('LD'), createdAt: new Date().toISOString() };
      this._setLocal(d => ({ ...d, leads: [...d.leads, newLead] }));
      return newLead;
    }
  },

  async updateLead(id, updates) {
    this._setLocal(d => ({
      ...d,
      leads: d.leads.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
    try {
      await api.updateLead(id, updates);
    } catch (err) {
      console.error('updateLead failed:', err);
    }
  },

  async deleteLead(id) {
    this._setLocal(d => ({ ...d, leads: d.leads.filter(l => l.id !== id) }));
    try {
      await api.deleteLead(id);
    } catch (err) {
      console.error('deleteLead failed:', err);
    }
  },

  // ============================================
  // Leave operations (API-backed)
  // ============================================
  async addLeave(leave) {
    try {
      const newLeave = await api.createLeave(leave);
      const data = await api.fetchAllData();
      this._setLocal(data);
      return newLeave;
    } catch (err) {
      console.error('addLeave failed:', err);
      const newLeave = { ...leave, id: generateId('LV'), appliedOn: new Date().toISOString(), status: 'Pending' };
      this._setLocal(d => ({ ...d, leaves: [...d.leaves, newLeave] }));
      return newLeave;
    }
  },

  async updateLeave(id, updates) {
    this._setLocal(d => ({
      ...d,
      leaves: d.leaves.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
    try {
      await api.updateLeave(id, updates);
    } catch (err) {
      console.error('updateLeave failed:', err);
    }
  },

  // ============================================
  // Employee operations (API-backed)
  // ============================================
  async addEmployee(emp) {
    try {
      const newEmp = await api.createEmployee(emp);
      this._setLocal(d => ({ ...d, employees: [...d.employees, newEmp] }));
      return newEmp;
    } catch (err) {
      console.error('addEmployee failed:', err);
      const newEmp = { ...emp, id: generateId('EMP') };
      this._setLocal(d => ({ ...d, employees: [...d.employees, newEmp] }));
      return newEmp;
    }
  },

  async updateEmployee(id, updates) {
    this._setLocal(d => ({
      ...d,
      employees: d.employees.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
    try {
      await api.updateEmployee(id, updates);
    } catch (err) {
      console.error('updateEmployee failed:', err);
    }
  },

  async deleteEmployee(id) {
    this._setLocal(d => ({ ...d, employees: d.employees.filter(e => e.id !== id) }));
    try {
      await api.deleteEmployee(id);
    } catch (err) {
      console.error('deleteEmployee failed:', err);
    }
  },

  // ============================================
  // Activity operations (API-backed)
  // ============================================
  async addActivity(type, action, detail, userId) {
    const activity = { id: generateId('ACT'), type, action, detail, user: userId, timestamp: new Date().toISOString() };
    this._setLocal(d => ({ ...d, activities: [activity, ...d.activities].slice(0, 50) }));
    try {
      await api.createActivity({ type, action, detail, user: userId });
    } catch (err) {
      console.error('addActivity failed:', err);
    }
  },

  // ============================================
  // Notification operations (API-backed)
  // ============================================
  async addNotification(type, message, userId) {
    const notification = { id: generateId('NT'), type, message, userId, read: false, timestamp: new Date().toISOString() };
    this._setLocal(d => ({ ...d, notifications: [notification, ...d.notifications] }));
    try {
      await api.createNotification({ type, message, userId });
    } catch (err) {
      console.error('addNotification failed:', err);
    }
  },

  async markNotificationRead(id) {
    this._setLocal(d => ({
      ...d,
      notifications: d.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
    try {
      await api.updateNotification(id, { read: true });
    } catch (err) {
      console.error('markNotificationRead failed:', err);
    }
  },

  async markAllNotificationsRead() {
    this._setLocal(d => ({
      ...d,
      notifications: d.notifications.map(n => ({ ...n, read: true }))
    }));
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error('markAllNotificationsRead failed:', err);
    }
  },

  // ============================================
  // Settings operations (API-backed)
  // ============================================
  async updateRolePermissions(role, permissions) {
    this._setLocal(d => {
      const exists = d.rolePermissions.find(rp => rp.role === role);
      if (exists) {
        return {
          ...d,
          rolePermissions: d.rolePermissions.map(rp => rp.role === role ? { ...rp, permissions } : rp)
        };
      }
      return {
        ...d,
        rolePermissions: [...d.rolePermissions, { role, permissions }]
      };
    });
    try {
      await api.updateRolePermissions(role, permissions);
    } catch (err) {
      console.error('updateRolePermissions failed:', err);
    }
  },
};

export default store;
