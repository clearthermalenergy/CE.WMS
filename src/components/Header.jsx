import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { useNotifications } from '../hooks/useStore';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../store/data';
import { useState, useRef, useEffect } from 'react';
import './Header.css';

export default function Header({ onMenuClick }) {
    const { data } = useStore();
    const { user, logout } = useAuth();
    const { unreadCount, notifications, markRead, markAllRead } = useNotifications();
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    // Use auth user directly — it comes from the JWT-verified session
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

                {currentUser && (
                    <div className="header-user">
                        <div className="avatar" style={{ background: getAvatarColor(currentUser.name), color: '#fff' }}>
                            {getInitials(currentUser.name)}
                        </div>
                        <div className="header-user-info">
                            <span className="header-user-name">{currentUser.name}</span>
                            <span className="header-user-role">{currentUser.role}</span>
                        </div>
                    </div>
                )}

                <button className="logout-btn" onClick={logout} title="Sign out" id="btn-logout">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
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
