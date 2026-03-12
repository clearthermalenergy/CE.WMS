import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../hooks/useStore';
import {
    LayoutDashboard, CheckSquare, Users, UserCog, CalendarDays,
    BarChart3, Activity, Settings, Zap, ChevronLeft, ChevronRight,
    Target
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/leads', icon: Target, label: 'Leads' },
    { path: '/leaves', icon: CalendarDays, label: 'Leaves' },
    { path: '/activities', icon: Activity, label: 'Activities' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/users', icon: UserCog, label: 'Users' },
];

export default function Sidebar({ mobileOpen, onClose }) {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { user } = useAuth(); // getting role from auth directly
    const { data } = useStore();

    const rp = data?.rolePermissions?.find(r => r.role === user?.role)?.permissions || {};
    const isAdmin = user?.role === 'Admin' || rp.full_system_control;

    const visibleNavItems = navItems.filter(item => {
        if (item.label === 'Users') return rp.manage_users || isAdmin;
        if (item.label === 'Reports') return rp.view_reports || isAdmin;
        return true;
    });

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <Zap size={20} />
                    </div>
                    {!collapsed && (
                        <div className="brand-text">
                            <span className="brand-name">Clear Energy</span>
                            <span className="brand-sub">Work Management</span>
                        </div>
                    )}
                </div>
                <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {visibleNavItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        onClick={onClose}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={path === '/'}
                    >
                        <Icon size={20} />
                        {!collapsed && <span>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                {isAdmin && (
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Settings size={20} />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                )}
            </div>
        </aside>
    );
}
