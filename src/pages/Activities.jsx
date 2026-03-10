import { useStore } from '../hooks/useStore';
import { formatDateTime } from '../store/data';
import { Activity as ActivityIcon, CheckSquare, Target, CalendarDays, LogIn, Bell, Filter, Search } from 'lucide-react';
import { useState } from 'react';
import './Activities.css';

const TYPE_CONFIG = {
    task: { icon: CheckSquare, color: '#6366f1', label: 'Task' },
    lead: { icon: Target, color: '#06d6a0', label: 'Lead' },
    leave: { icon: CalendarDays, color: '#f59e0b', label: 'Leave' },
    login: { icon: LogIn, color: '#64748b', label: 'Login' },
};

export default function Activities() {
    const { data, store } = useStore();
    const { activities, notifications } = data;
    const [tab, setTab] = useState('activities');
    const [filterType, setFilterType] = useState('All');

    const filteredActivities = filterType === 'All'
        ? activities
        : activities.filter(a => a.type === filterType.toLowerCase());

    return (
        <div className="activities-page animate-in">
            <div className="page-header">
                <div>
                    <h1>Activities & Notifications</h1>
                    <p>Track all system activity and alerts</p>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${tab === 'activities' ? 'active' : ''}`} onClick={() => setTab('activities')}>
                    <ActivityIcon size={16} /> Activity Log
                </button>
                <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
                    <Bell size={16} /> Notifications
                    {notifications.filter(n => !n.read).length > 0 && (
                        <span className="tab-badge">{notifications.filter(n => !n.read).length}</span>
                    )}
                </button>
            </div>

            {tab === 'activities' && (
                <>
                    <div className="filter-bar">
                        <div className="search-input" style={{ maxWidth: '300px' }}>
                            <Search size={18} />
                            <input type="text" placeholder="Search activities..." />
                        </div>
                        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="All">All Types</option>
                            <option value="Task">Tasks</option>
                            <option value="Lead">Leads</option>
                            <option value="Leave">Leaves</option>
                            <option value="Login">Login</option>
                        </select>
                    </div>

                    <div className="activity-timeline">
                        {filteredActivities.map((act, i) => {
                            const config = TYPE_CONFIG[act.type] || TYPE_CONFIG.login;
                            const Icon = config.icon;
                            return (
                                <div key={act.id} className="timeline-item" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="timeline-line" />
                                    <div className="timeline-icon" style={{ background: `${config.color}20`, color: config.color }}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="timeline-content glass-card">
                                        <div className="timeline-header">
                                            <span className="timeline-action">{act.action}</span>
                                            <span className="timeline-badge" style={{ background: `${config.color}15`, color: config.color }}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <p className="timeline-detail">{act.detail}</p>
                                        <div className="timeline-meta">
                                            <span>{store.getEmployeeName(act.user)}</span>
                                            <span>•</span>
                                            <span>{formatDateTime(act.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {tab === 'notifications' && (
                <div className="notifications-list">
                    {notifications.length === 0 ? (
                        <div className="empty-state">
                            <Bell size={48} />
                            <h3>No notifications</h3>
                            <p>You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map(n => {
                            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.login;
                            const Icon = config.icon;
                            return (
                                <div key={n.id} className={`notification-card glass-card ${n.read ? 'read' : 'unread'}`} onClick={() => store.markNotificationRead(n.id)}>
                                    <div className="notif-icon" style={{ background: `${config.color}20`, color: config.color }}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="notif-body">
                                        <p>{n.message}</p>
                                        <span className="notif-time">{formatDateTime(n.timestamp)}</span>
                                    </div>
                                    {!n.read && <div className="notif-unread-dot" />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
