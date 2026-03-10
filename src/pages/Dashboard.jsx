import { useStore } from '../hooks/useStore';
import { getInitials, getAvatarColor, formatDate, formatDateTime, isToday } from '../store/data';
import {
    CheckSquare, Clock, AlertTriangle, CheckCircle, Target, TrendingUp,
    DollarSign, Users, CalendarDays, Activity, ArrowUpRight, ArrowDownRight,
    BarChart3
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard() {
    const { data, store } = useStore();
    const { tasks, leads, leaves, employees, activities } = data;

    // Task stats
    const taskStats = {
        pending: tasks.filter(t => t.status === 'To-Do').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'Done').length,
        dueToday: tasks.filter(t => isToday(t.dueDate)).length,
    };

    // Lead stats
    const leadStats = {
        total: leads.length,
        converted: leads.filter(l => l.status === 'Won').length,
        pipeline: leads.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + l.dealValue, 0),
        closed: leads.filter(l => l.status === 'Won').reduce((s, l) => s + l.dealValue, 0),
    };

    // Leave stats
    const leaveStats = {
        onLeaveToday: leaves.filter(l => l.status === 'Approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length,
        pending: leaves.filter(l => l.status === 'Pending').length,
        approved: leaves.filter(l => l.status === 'Approved').length,
    };

    const conversionRate = leads.length > 0 ? Math.round((leadStats.converted / leads.length) * 100) : 0;

    // Charts data
    const taskChartData = {
        labels: ['To-Do', 'This Week', 'In Progress', 'Done'],
        datasets: [{
            data: [
                tasks.filter(t => t.status === 'To-Do').length,
                tasks.filter(t => t.status === 'This Week').length,
                tasks.filter(t => t.status === 'In Progress').length,
                tasks.filter(t => t.status === 'Done').length,
            ],
            backgroundColor: ['#6366f1', '#3b82f6', '#f59e0b', '#06d6a0'],
            borderWidth: 0,
            borderRadius: 4,
        }]
    };

    const leadSourceData = {
        labels: ['Website', 'Referral', 'Cold call', 'Advertisement'],
        datasets: [{
            data: [
                leads.filter(l => l.leadSource === 'Website').length,
                leads.filter(l => l.leadSource === 'Referral').length,
                leads.filter(l => l.leadSource === 'Cold call').length,
                leads.filter(l => l.leadSource === 'Advertisement').length,
            ],
            backgroundColor: ['#6366f1', '#06d6a0', '#f59e0b', '#3b82f6'],
            borderWidth: 0,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } }
            }
        }
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
        }
    };

    const formatCurrency = (val) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
        return `₹${val}`;
    };

    return (
        <div className="dashboard animate-in">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back! Here's your team overview.</p>
                </div>
                <div className="page-actions">
                    <span className="dashboard-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Task Stats */}
            <div className="stats-grid">
                <div className="stat-card indigo">
                    <div className="stat-card-header">
                        <div className="stat-card-icon indigo"><Clock size={20} /></div>
                        <div className="stat-card-change up"><ArrowUpRight size={14} /> 12%</div>
                    </div>
                    <div className="stat-card-value">{taskStats.pending}</div>
                    <div className="stat-card-label">Tasks Pending</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-card-header">
                        <div className="stat-card-icon blue"><AlertTriangle size={20} /></div>
                        <div className="stat-card-change up"><ArrowUpRight size={14} /> 8%</div>
                    </div>
                    <div className="stat-card-value">{taskStats.inProgress}</div>
                    <div className="stat-card-label">In Progress</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-card-header">
                        <div className="stat-card-icon green"><CheckCircle size={20} /></div>
                        <div className="stat-card-change up"><ArrowUpRight size={14} /> 24%</div>
                    </div>
                    <div className="stat-card-value">{taskStats.completed}</div>
                    <div className="stat-card-label">Tasks Completed</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-card-header">
                        <div className="stat-card-icon amber"><CalendarDays size={20} /></div>
                    </div>
                    <div className="stat-card-value">{taskStats.dueToday}</div>
                    <div className="stat-card-label">Due Today</div>
                </div>
            </div>

            {/* Sales Stats */}
            <div className="stats-grid">
                <div className="stat-card green">
                    <div className="stat-card-header">
                        <div className="stat-card-icon green"><Target size={20} /></div>
                        <div className="stat-card-change up"><ArrowUpRight size={14} /> 15%</div>
                    </div>
                    <div className="stat-card-value">{leadStats.total}</div>
                    <div className="stat-card-label">Total Leads</div>
                </div>
                <div className="stat-card indigo">
                    <div className="stat-card-header">
                        <div className="stat-card-icon indigo"><TrendingUp size={20} /></div>
                    </div>
                    <div className="stat-card-value">{conversionRate}%</div>
                    <div className="stat-card-label">Conversion Rate</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-card-header">
                        <div className="stat-card-icon blue"><DollarSign size={20} /></div>
                        <div className="stat-card-change up"><ArrowUpRight size={14} /> 32%</div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(leadStats.pipeline)}</div>
                    <div className="stat-card-label">Pipeline Value</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-card-header">
                        <div className="stat-card-icon green"><BarChart3 size={20} /></div>
                    </div>
                    <div className="stat-card-value">{formatCurrency(leadStats.closed)}</div>
                    <div className="stat-card-label">Deals Closed</div>
                </div>
            </div>

            {/* Charts & Activity */}
            <div className="dashboard-grid">
                <div className="glass-card dashboard-chart-card">
                    <div className="card-header">
                        <h3>Task Distribution</h3>
                    </div>
                    <div className="chart-container">
                        <Bar data={taskChartData} options={barOptions} />
                    </div>
                </div>

                <div className="glass-card dashboard-chart-card">
                    <div className="card-header">
                        <h3>Leads by Source</h3>
                    </div>
                    <div className="chart-container">
                        <Doughnut data={leadSourceData} options={chartOptions} />
                    </div>
                </div>

                <div className="glass-card dashboard-activity-card">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                        <span className="badge badge-primary">{activities.length} events</span>
                    </div>
                    <div className="activity-list">
                        {activities.slice(0, 8).map(act => (
                            <div key={act.id} className="activity-item">
                                <div className={`activity-dot ${act.type}`} />
                                <div className="activity-info">
                                    <div className="activity-action">{act.action}</div>
                                    <div className="activity-detail">{act.detail}</div>
                                    <div className="activity-meta">
                                        <span>{store.getEmployeeName(act.user)}</span>
                                        <span>•</span>
                                        <span>{formatDateTime(act.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leave & Team */}
            <div className="dashboard-bottom-grid">
                <div className="glass-card">
                    <div className="card-header">
                        <h3>Leave Overview</h3>
                    </div>
                    <div className="leave-stats-mini">
                        <div className="leave-stat-item">
                            <div className="leave-stat-value text-warning">{leaveStats.onLeaveToday}</div>
                            <div className="leave-stat-label">On Leave Today</div>
                        </div>
                        <div className="leave-stat-item">
                            <div className="leave-stat-value text-amber">{leaveStats.pending}</div>
                            <div className="leave-stat-label">Pending Requests</div>
                        </div>
                        <div className="leave-stat-item">
                            <div className="leave-stat-value text-green">{leaveStats.approved}</div>
                            <div className="leave-stat-label">Approved</div>
                        </div>
                    </div>
                    <div className="leave-list-mini">
                        {leaves.filter(l => l.status === 'Pending').slice(0, 3).map(l => (
                            <div key={l.id} className="leave-item-mini">
                                <div className="avatar avatar-sm" style={{ background: getAvatarColor(store.getEmployeeName(l.employeeId)), color: '#fff' }}>
                                    {getInitials(store.getEmployeeName(l.employeeId))}
                                </div>
                                <div className="leave-item-info">
                                    <span className="leave-item-name">{store.getEmployeeName(l.employeeId)}</span>
                                    <span className="leave-item-type">{l.leaveType} • {formatDate(l.startDate)} - {formatDate(l.endDate)}</span>
                                </div>
                                <span className="badge badge-warning">Pending</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card">
                    <div className="card-header">
                        <h3>Team Members</h3>
                        <span className="badge badge-success">{employees.filter(e => e.status === 'Active').length} Active</span>
                    </div>
                    <div className="team-list">
                        {employees.slice(0, 6).map(emp => (
                            <div key={emp.id} className="team-member">
                                <div className="avatar" style={{ background: getAvatarColor(emp.name), color: '#fff' }}>
                                    {getInitials(emp.name)}
                                </div>
                                <div className="team-member-info">
                                    <span className="team-member-name">{emp.name}</span>
                                    <span className="team-member-dept">{emp.department} • {emp.role}</span>
                                </div>
                                <div className={`status-indicator ${emp.status === 'Active' ? 'online' : 'offline'}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
