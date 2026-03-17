import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { useNotifications } from '../hooks/useStore';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate } from '../store/data';
import { useState, useRef, useEffect } from 'react';
import './Header.css';

export default function Header({ onMenuClick }) {
    const { data } = useStore();
    const { user, logout } = useAuth();
    const { unreadCount, notifications, markRead, markAllRead } = useNotifications();
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    const currentUser = user || data.employees.find(e => e.id === data.currentUser);

    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifs(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="header">
            <div className="header-left">
                <button className="btn-ghost mobile-menu-btn" onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <div className="header-search">
                    <Search size={18} />
                    <input type="text" placeholder="Search tasks, leads, employees..." />
                </div>
            </div>

            <div className="header-right">
                <div className="notif-container" ref={notifRef}>
                    <button className="notif-btn" onClick={() => setShowNotifs(!showNotifs)} id="btn-notifications">
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                    </button>

                    {showNotifs && (
                        <div className="notif-dropdown">
                            <div className="notif-dropdown-header">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && (
                                    <button className="btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                                )}
                            </div>
                            <div className="notif-list">
                                {notifications.slice(0, 8).map(n => (
                                    <div
                                        key={n.id}
                                        className={`notif-item ${n.read ? '' : 'unread'}`}
                                        onClick={() => markRead(n.id)}
                                    >
                                        <div className={`notif-dot ${n.type}`} />
                                        <div className="notif-content">
                                            <p>{n.message}</p>
                                            <span className="notif-time">{timeAgo(n.timestamp)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {currentUser && <UserProfileButton currentUser={currentUser} />}

                <button className="logout-btn" onClick={logout} title="Sign out" id="btn-logout">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}

function UserProfileButton({ currentUser }) {
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        }
        function handleEsc(e) {
            if (e.key === 'Escape') setShowProfile(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    const roleColors = {
        Admin: '#f59e0b',
        Manager: '#6366f1',
        Employee: '#3b82f6',
    };

    return (
        <div className="header-user-wrapper" ref={profileRef}>
            <button
                className="header-user"
                id="btn-header-profile"
                onClick={() => setShowProfile(v => !v)}
                title="View your profile"
            >
                <div className="avatar" style={{ background: getAvatarColor(currentUser.name), color: '#fff' }}>
                    {getInitials(currentUser.name)}
                </div>
                <div className="header-user-info">
                    <span className="header-user-name">{currentUser.name}</span>
                    <span className="header-user-role">{currentUser.role}</span>
                </div>
            </button>

            {showProfile && (
                <div className="profile-panel" role="dialog" aria-label="Your profile">
                    <div
                        className="profile-panel-header"
                        style={{
                            background: `linear-gradient(135deg, ${getAvatarColor(currentUser.name)}44 0%, ${getAvatarColor(currentUser.name)}11 100%)`,
                        }}
                    >
                        <div
                            className="profile-avatar-lg"
                            style={{ background: getAvatarColor(currentUser.name), color: '#fff' }}
                        >
                            {getInitials(currentUser.name)}
                        </div>
                        <div className="profile-panel-name-block">
                            <h3 className="profile-panel-name">{currentUser.name}</h3>
                            <span className="profile-id-badge">{currentUser.id}</span>
                        </div>
                        <span
                            className="profile-role-badge"
                            style={{
                                background: `${roleColors[currentUser.role]}22`,
                                color: roleColors[currentUser.role],
                                border: `1px solid ${roleColors[currentUser.role]}55`,
                            }}
                        >
                            {currentUser.role}
                        </span>
                    </div>

                    <div className="profile-panel-body">
                        <ProfileRow icon="✉️" label="Email" value={currentUser.email || '—'} />
                        <ProfileRow icon="📞" label="Phone" value={currentUser.phone || '—'} />
                        <ProfileRow icon="🏢" label="Department" value={currentUser.department || '—'} />
                        <ProfileRow
                            icon="📅"
                            label="Joined"
                            value={currentUser.joinDate ? formatDate(currentUser.joinDate) : '—'}
                        />
                        <ProfileRow
                            icon={currentUser.status === 'Active' ? '🟢' : '🔴'}
                            label="Status"
                            value={currentUser.status || '—'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileRow({ icon, label, value }) {
    return (
        <div className="profile-row">
            <span className="profile-row-icon">{icon}</span>
            <div className="profile-row-content">
                <span className="profile-row-label">{label}</span>
                <span className="profile-row-value">{value}</span>
            </div>
        </div>
    );
}

function timeAgo(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
