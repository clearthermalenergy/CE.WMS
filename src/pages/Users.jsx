import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate } from '../store/data';
import { Plus, Search, Edit2, Trash2, X, Mail, Phone, Building, Calendar, Shield, Lock } from 'lucide-react';
import './Users.css';

const DEPARTMENTS = ['Sales', 'Engineering', 'Marketing', 'HR', 'Operations', 'Finance', 'Leadership'];
const ROLES = ['Admin', 'Manager', 'Employee'];

export default function Users() {
    const { data, store } = useStore();
    const { user } = useAuth();
    const { employees, rolePermissions } = data;
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    const [filterRole, setFilterRole] = useState('All');

    const rp = rolePermissions?.find(r => r.role === user?.role)?.permissions || {};
    const canManageUsers = user?.role === 'Admin' || rp.manage_users || rp.full_system_control;

    if (!canManageUsers) {
        return (
            <div className="users-page animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
                <Lock size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h2>Access Denied</h2>
                <p style={{ color: 'var(--text-muted)' }}>You need User Management privileges to view or manage users.</p>
            </div>
        );
    }

    const filteredEmployees = employees.filter(e => {
        if (searchTerm && !e.name.toLowerCase().includes(searchTerm.toLowerCase()) && !e.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterDept !== 'All' && e.department !== filterDept) return false;
        if (filterRole !== 'All' && e.role !== filterRole) return false;
        return true;
    });

    const handleSave = (userData) => {
        if (editUser) {
            store.updateEmployee(editUser.id, userData);
        } else {
            store.addEmployee(userData);
        }
        setShowModal(false);
        setEditUser(null);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this employee?')) store.deleteEmployee(id);
    };

    const roleColors = {
        Admin: '#f59e0b',
        Manager: '#6366f1',
        Employee: '#3b82f6',
    };

    return (
        <div className="users-page animate-in">
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p>Manage employees and access control</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" id="btn-add-user" onClick={() => { setEditUser(null); setShowModal(true); }}>
                        <Plus size={18} /> Add Employee
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="user-stats">
                <div className="user-stat-item">
                    <span className="user-stat-value">{employees.length}</span>
                    <span className="user-stat-label">Total</span>
                </div>
                <div className="user-stat-item">
                    <span className="user-stat-value" style={{ color: '#f59e0b' }}>{employees.filter(e => e.role === 'Admin').length}</span>
                    <span className="user-stat-label">Admins</span>
                </div>
                <div className="user-stat-item">
                    <span className="user-stat-value" style={{ color: '#6366f1' }}>{employees.filter(e => e.role === 'Manager').length}</span>
                    <span className="user-stat-label">Managers</span>
                </div>
                <div className="user-stat-item">
                    <span className="user-stat-value" style={{ color: '#3b82f6' }}>{employees.filter(e => e.role === 'Employee').length}</span>
                    <span className="user-stat-label">Employees</span>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input type="text" placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="All">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            <div className="user-grid">
                {filteredEmployees.map(emp => (
                    <div key={emp.id} className="user-card glass-card">
                        <div className="user-card-header">
                            <div className="avatar avatar-lg" style={{ background: getAvatarColor(emp.name), color: '#fff' }}>
                                {getInitials(emp.name)}
                            </div>
                            <div className="user-card-actions">
                                <button className="btn-ghost" onClick={() => { setEditUser(emp); setShowModal(true); }}><Edit2 size={14} /></button>
                                <button className="btn-ghost" onClick={() => handleDelete(emp.id)}><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <h3 className="user-card-name">{emp.name}</h3>
                        <span className="user-card-id">{emp.id}</span>
                        <div className="user-card-role">
                            <span className="role-badge" style={{ background: `${roleColors[emp.role]}20`, color: roleColors[emp.role] }}>
                                <Shield size={12} /> {emp.role}
                            </span>
                        </div>
                        <div className="user-card-details">
                            <div className="user-detail"><Mail size={14} /> <span>{emp.email}</span></div>
                            <div className="user-detail"><Phone size={14} /> <span>{emp.phone}</span></div>
                            <div className="user-detail"><Building size={14} /> <span>{emp.department}</span></div>
                            <div className="user-detail"><Calendar size={14} /> <span>Joined {formatDate(emp.joinDate)}</span></div>
                        </div>
                        <div className="user-card-footer">
                            <span className={`status-dot ${emp.status === 'Active' ? 'active' : 'inactive'}`} />
                            <span>{emp.status}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Permission Matrix */}
            <div className="permission-section glass-card">
                <h3>Role Permissions</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '14px' }}>Toggle permissions for each role dynamically. Changes take effect immediately.</p>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Permission</th>
                                <th>Admin</th>
                                <th>Manager</th>
                                <th>Employee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { key: 'full_system_control', label: 'Full System Control (Overrides All)' },
                                { key: 'manage_team_tasks', label: 'Manage Team Tasks' },
                                { key: 'personal_tasks', label: 'Personal Tasks' },
                                { key: 'view_all_leads', label: 'View All Leads' },
                                { key: 'manage_assigned_leads', label: 'Manage Assigned Leads' },
                                { key: 'approve_leave', label: 'Approve Leave' },
                                { key: 'apply_leave', label: 'Apply Leave' },
                                { key: 'view_reports', label: 'View Reports' },
                                { key: 'manage_users', label: 'Manage Users' },
                            ].map(({ key, label }) => (
                                <tr key={key}>
                                    <td style={{ textAlign: 'left', fontWeight: '500' }}>{label}</td>
                                    {['Admin', 'Manager', 'Employee'].map(role => {
                                        const rp = rolePermissions.find(r => r.role === role);
                                        const isChecked = rp?.permissions[key] || false;
                                        return (
                                            <td key={role} style={{ textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={e => {
                                                        const newVal = e.target.checked;
                                                        const currentPerms = rp ? { ...rp.permissions } : {};
                                                        currentPerms[key] = newVal;
                                                        store.updateRolePermissions(role, currentPerms);
                                                    }}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); setEditUser(null); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editUser ? 'Edit Employee' : 'Add Employee'}</h2>
                            <button className="btn-ghost" onClick={() => { setShowModal(false); setEditUser(null); }}><X size={20} /></button>
                        </div>
                        <UserForm user={editUser} employees={employees} onSave={handleSave} onClose={() => { setShowModal(false); setEditUser(null); }} />
                    </div>
                </div>
            )}
        </div>
    );
}

function UserForm({ user, employees, onSave, onClose }) {
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || 'Engineering',
        role: user?.role || 'Employee',
        manager: user?.manager || '',
        joinDate: user?.joinDate || '',
        status: user?.status || 'Active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Manager</label>
                        <select value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))}>
                            <option value="">No manager</option>
                            {employees.filter(e => e.role === 'Manager' || e.role === 'Admin').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Joining Date</label>
                        <input type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">{user ? 'Update' : 'Add Employee'}</button>
            </div>
        </form>
    );
}
