import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate } from '../store/data';
import { Plus, Search, Check, X, Calendar, Clock, Briefcase, Heart, AlertTriangle, Home, Filter } from 'lucide-react';
import './Leaves.css';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Work From Home', 'Emergency Leave'];
const LEAVE_ICONS = {
    'Casual Leave': Calendar,
    'Sick Leave': Heart,
    'Earned Leave': Briefcase,
    'Work From Home': Home,
    'Emergency Leave': AlertTriangle,
};

export default function Leaves() {
    const { data, store } = useStore();
    const { user } = useAuth();
    const { leaves, employees, leaveBalances, rolePermissions } = data;
    const [showModal, setShowModal] = useState(false);
    const [tab, setTab] = useState('requests');

    const rp = rolePermissions?.find(r => r.role === user?.role)?.permissions || {};
    const canApprove = rp.approve_leave || rp.full_system_control;
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [selectedEmployee, setSelectedEmployee] = useState('All');

    const filteredLeaves = leaves.filter(l => {
        if (filterStatus !== 'All' && l.status !== filterStatus) return false;
        if (filterType !== 'All' && l.leaveType !== filterType) return false;
        if (selectedEmployee !== 'All' && l.employeeId !== selectedEmployee) return false;
        return true;
    }).sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

    const pendingCount = leaves.filter(l => l.status === 'Pending').length;
    const approvedCount = leaves.filter(l => l.status === 'Approved').length;
    const onLeaveToday = leaves.filter(l => l.status === 'Approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date());

    const handleApprove = (id) => {
        store.updateLeave(id, { status: 'Approved' });
        const leave = leaves.find(l => l.id === id);
        if (leave) {
            store.addActivity('leave', 'Leave approved', `${store.getEmployeeName(leave.employeeId)} - ${leave.leaveType}`, data.currentUser);
            store.addNotification('leave', `Your ${leave.leaveType} has been approved`, leave.employeeId);
        }
    };

    const handleReject = (id) => {
        store.updateLeave(id, { status: 'Rejected' });
        const leave = leaves.find(l => l.id === id);
        if (leave) {
            store.addActivity('leave', 'Leave rejected', `${store.getEmployeeName(leave.employeeId)} - ${leave.leaveType}`, data.currentUser);
            store.addNotification('leave', `Your ${leave.leaveType} has been rejected`, leave.employeeId);
        }
    };

    const handleApply = (leaveData) => {
        store.addLeave(leaveData);
        setShowModal(false);
    };

    return (
        <div className="leaves-page animate-in">
            <div className="page-header">
                <div>
                    <h1>Leave Management</h1>
                    <p>Manage employee leave requests and balances</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" id="btn-apply-leave" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Apply Leave
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="leave-overview">
                <div className="leave-overview-card">
                    <div className="leave-ov-icon pending"><Clock size={20} /></div>
                    <div className="leave-ov-info">
                        <span className="leave-ov-value">{pendingCount}</span>
                        <span className="leave-ov-label">Pending Requests</span>
                    </div>
                </div>
                <div className="leave-overview-card">
                    <div className="leave-ov-icon approved"><Check size={20} /></div>
                    <div className="leave-ov-info">
                        <span className="leave-ov-value">{approvedCount}</span>
                        <span className="leave-ov-label">Approved</span>
                    </div>
                </div>
                <div className="leave-overview-card">
                    <div className="leave-ov-icon today"><Calendar size={20} /></div>
                    <div className="leave-ov-info">
                        <span className="leave-ov-value">{onLeaveToday.length}</span>
                        <span className="leave-ov-label">On Leave Today</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
                    Leave Requests {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                </button>
                <button className={`tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
                    Leave Calendar
                </button>
                <button className={`tab ${tab === 'balance' ? 'active' : ''}`} onClick={() => setTab('balance')}>
                    Leave Balance
                </button>
            </div>

            {tab === 'requests' && (
                <>
                    <div className="filter-bar">
                        <div className="search-input" style={{ maxWidth: '250px' }}>
                            <Search size={18} />
                            <input type="text" placeholder="Search..." />
                        </div>
                        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="All">All Types</option>
                            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="leave-requests-list">
                        {filteredLeaves.map(leave => {
                            const LeaveIcon = LEAVE_ICONS[leave.leaveType] || Calendar;
                            return (
                                <div key={leave.id} className={`leave-request-card glass-card ${leave.status.toLowerCase()}`}>
                                    <div className="leave-req-left">
                                        <div className="avatar" style={{ background: getAvatarColor(store.getEmployeeName(leave.employeeId)), color: '#fff' }}>
                                            {getInitials(store.getEmployeeName(leave.employeeId))}
                                        </div>
                                        <div className="leave-req-info">
                                            <h4>{store.getEmployeeName(leave.employeeId)}</h4>
                                            <div className="leave-req-type">
                                                <LeaveIcon size={14} />
                                                <span>{leave.leaveType}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="leave-req-dates">
                                        <span className="leave-req-range">{formatDate(leave.startDate)} — {formatDate(leave.endDate)}</span>
                                        <span className="leave-req-days">{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
                                    </div>

                                    <div className="leave-req-reason">
                                        <span>{leave.reason}</span>
                                    </div>

                                    <div className="leave-req-actions">
                                        {leave.status === 'Pending' ? (
                                            canApprove ? (
                                                <>
                                                    <button className="btn btn-sm btn-approve" onClick={() => handleApprove(leave.id)}>
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button className="btn btn-sm btn-reject" onClick={() => handleReject(leave.id)}>
                                                        <X size={14} /> Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="badge badge-warning">Pending</span>
                                            )
                                        ) : (
                                            <span className={`badge badge-${leave.status === 'Approved' ? 'success' : 'danger'}`}>
                                                {leave.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {tab === 'calendar' && (
                <div className="leave-calendar-section">
                    <h3 className="section-title">Who's Away Today</h3>
                    <div className="away-today-list">
                        {onLeaveToday.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={48} />
                                <h3>No one is on leave today</h3>
                                <p>All team members are available</p>
                            </div>
                        ) : (
                            onLeaveToday.map(l => (
                                <div key={l.id} className="away-card glass-card">
                                    <div className="avatar" style={{ background: getAvatarColor(store.getEmployeeName(l.employeeId)), color: '#fff' }}>
                                        {getInitials(store.getEmployeeName(l.employeeId))}
                                    </div>
                                    <div>
                                        <h4>{store.getEmployeeName(l.employeeId)}</h4>
                                        <p>{l.leaveType} • {formatDate(l.startDate)} - {formatDate(l.endDate)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <h3 className="section-title" style={{ marginTop: '2rem' }}>Upcoming Leaves</h3>
                    <div className="away-today-list">
                        {leaves.filter(l => l.status === 'Approved' && new Date(l.startDate) > new Date()).map(l => (
                            <div key={l.id} className="away-card glass-card">
                                <div className="avatar" style={{ background: getAvatarColor(store.getEmployeeName(l.employeeId)), color: '#fff' }}>
                                    {getInitials(store.getEmployeeName(l.employeeId))}
                                </div>
                                <div>
                                    <h4>{store.getEmployeeName(l.employeeId)}</h4>
                                    <p>{l.leaveType} • {formatDate(l.startDate)} - {formatDate(l.endDate)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'balance' && (
                <div className="leave-balance-section">
                    <select className="filter-select" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} style={{ marginBottom: '1.5rem', maxWidth: '300px' }}>
                        <option value="All">All Employees</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>

                    <div className="balance-grid">
                        {employees.filter(e => selectedEmployee === 'All' || e.id === selectedEmployee).map(emp => {
                            const bal = leaveBalances[emp.id];
                            if (!bal) return null;
                            return (
                                <div key={emp.id} className="balance-card glass-card">
                                    <div className="balance-card-header">
                                        <div className="avatar" style={{ background: getAvatarColor(emp.name), color: '#fff' }}>
                                            {getInitials(emp.name)}
                                        </div>
                                        <div>
                                            <h4>{emp.name}</h4>
                                            <span>{emp.department}</span>
                                        </div>
                                    </div>
                                    <div className="balance-items">
                                        <BalanceItem label="Casual" total={bal.casual} used={bal.casualUsed} color="#6366f1" />
                                        <BalanceItem label="Sick" total={bal.sick} used={bal.sickUsed} color="#ef4444" />
                                        <BalanceItem label="Earned" total={bal.earned} used={bal.earnedUsed} color="#06d6a0" />
                                        <BalanceItem label="WFH" total={bal.wfh} used={bal.wfhUsed} color="#3b82f6" />
                                        <BalanceItem label="Emergency" total={bal.emergency} used={bal.emergencyUsed} color="#f59e0b" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Apply Leave Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Apply for Leave</h2>
                            <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <LeaveForm employees={employees} onSave={handleApply} onClose={() => setShowModal(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}

function BalanceItem({ label, total, used, color }) {
    const remaining = total - used;
    const pct = total > 0 ? (used / total) * 100 : 0;
    return (
        <div className="balance-item">
            <div className="balance-item-header">
                <span className="balance-item-label">{label}</span>
                <span className="balance-item-nums">{used}/{total}</span>
            </div>
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="balance-item-remain">{remaining} remaining</span>
        </div>
    );
}

function LeaveForm({ employees, onSave, onClose }) {
    const [form, setForm] = useState({
        employeeId: '',
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: '',
    });

    const totalDays = form.startDate && form.endDate
        ? Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)) + 1)
        : 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...form, totalDays });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div className="form-group">
                    <label className="form-label">Employee *</label>
                    <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} required>
                        <option value="">Select employee</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Leave Type</label>
                    <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}>
                        {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Start Date *</label>
                        <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">End Date *</label>
                        <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required />
                    </div>
                </div>
                {totalDays > 0 && (
                    <div className="leave-total-days">
                        Total: <strong>{totalDays} day{totalDays > 1 ? 's' : ''}</strong>
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">Reason *</label>
                    <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for leave..." required />
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
            </div>
        </form>
    );
}
