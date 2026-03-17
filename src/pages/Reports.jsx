import { useStore } from '../hooks/useStore';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, BarChart3, Target, CalendarDays } from 'lucide-react';
import './Reports.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default function Reports() {
    const { data, store } = useStore();
    const { tasks, leads, leaves, employees } = data;
    const [tab, setTab] = useState('tasks');

    const chartTextColor = '#94a3b8';
    const gridColor = 'rgba(255,255,255,0.04)';

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: chartTextColor, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: chartTextColor, font: { size: 11 } } },
            y: { grid: { color: gridColor }, ticks: { color: chartTextColor, font: { size: 11 } } },
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: chartTextColor, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } } }
        }
    };

    // Task Reports Data
    const tasksByEmployee = employees.map(e => ({
        name: e.name.split(' ')[0],
        completed: tasks.filter(t => t.assignedTo === e.id && t.status === 'Done').length,
        inProgress: tasks.filter(t => t.assignedTo === e.id && t.status === 'In Progress').length,
        total: tasks.filter(t => t.assignedTo === e.id).length,
    }));

    const taskProductivity = {
        labels: tasksByEmployee.map(t => t.name),
        datasets: [
            { label: 'Completed', data: tasksByEmployee.map(t => t.completed), backgroundColor: '#06d6a0', borderRadius: 4 },
            { label: 'In Progress', data: tasksByEmployee.map(t => t.inProgress), backgroundColor: '#f59e0b', borderRadius: 4 },
        ]
    };

    const taskPriority = {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
            data: [tasks.filter(t => t.priority === 'High').length, tasks.filter(t => t.priority === 'Medium').length, tasks.filter(t => t.priority === 'Low').length],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 0,
        }]
    };

    // Sales Reports Data
    const leadsByStage = {
        labels: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
        datasets: [{
            label: 'Leads',
            data: ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map(s => leads.filter(l => l.status === s).length),
            backgroundColor: ['#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b', '#f97316', '#06d6a0', '#ef4444'],
            borderWidth: 0,
            borderRadius: 4,
        }]
    };

    const revenueForecast = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Revenue (₹L)',
            data: [45, 68, 82, 55, 95, 120],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
        }]
    };

    const salesBySource = {
        labels: ['Website', 'Referral', 'Cold Call', 'Advertisement'],
        datasets: [{
            data: [leads.filter(l => l.leadSource === 'Website').reduce((s, l) => s + l.dealValue, 0) / 100000,
            leads.filter(l => l.leadSource === 'Referral').reduce((s, l) => s + l.dealValue, 0) / 100000,
            leads.filter(l => l.leadSource === 'Cold call').reduce((s, l) => s + l.dealValue, 0) / 100000,
            leads.filter(l => l.leadSource === 'Advertisement').reduce((s, l) => s + l.dealValue, 0) / 100000],
            backgroundColor: ['#6366f1', '#06d6a0', '#f59e0b', '#3b82f6'],
            borderWidth: 0,
        }]
    };

    // Leave Reports
    const leaveByType = {
        labels: ['Casual', 'Sick', 'Earned', 'WFH', 'Emergency'],
        datasets: [{
            data: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Work From Home', 'Emergency Leave'].map(t => leaves.filter(l => l.leaveType === t).length),
            backgroundColor: ['#6366f1', '#ef4444', '#06d6a0', '#3b82f6', '#f59e0b'],
            borderWidth: 0,
        }]
    };

    const leaveByDept = {
        labels: ['Sales', 'Engineering', 'Marketing', 'HR'],
        datasets: [{
            label: 'Leave Days',
            data: ['Sales', 'Engineering', 'Marketing', 'HR'].map(dept => {
                const deptEmps = employees.filter(e => e.department === dept).map(e => e.id);
                return leaves.filter(l => deptEmps.includes(l.employeeId)).reduce((s, l) => s + l.totalDays, 0);
            }),
            backgroundColor: '#8b5cf6',
            borderRadius: 4,
        }]
    };

    const handleExport = (format) => {
        alert(`Export as ${format} will be available in the production version.`);
    };

    return (
        <div className="reports-page animate-in">
            <div className="page-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p>Comprehensive insights across all modules</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={() => handleExport('CSV')}><Download size={16} /> Export CSV</button>
                    <button className="btn btn-secondary" onClick={() => handleExport('PDF')}><FileText size={16} /> Export PDF</button>
                </div>
            </div>

            <div className="tabs">
                <button className={`tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
                    <BarChart3 size={16} /> Task Reports
                </button>
                <button className={`tab ${tab === 'sales' ? 'active' : ''}`} onClick={() => setTab('sales')}>
                    <Target size={16} /> Sales Reports
                </button>
                <button className={`tab ${tab === 'leaves' ? 'active' : ''}`} onClick={() => setTab('leaves')}>
                    <CalendarDays size={16} /> Leave Reports
                </button>
            </div>

            {tab === 'tasks' && (
                <div className="reports-grid">
                    <div className="report-card glass-card">
                        <h3>Tasks by Employee</h3>
                        <div className="report-chart"><Bar data={taskProductivity} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { ...commonOptions.plugins.legend, display: true } } }} /></div>
                    </div>
                    <div className="report-card glass-card">
                        <h3>Task Priority Distribution</h3>
                        <div className="report-chart"><Doughnut data={taskPriority} options={doughnutOptions} /></div>
                    </div>
                    <div className="report-card glass-card full-width">
                        <h3>Task Summary</h3>
                        <div className="report-stats">
                            <Link to="/tasks" className="report-stat report-stat-link">
                                <span className="report-stat-value">{tasks.length}</span>
                                <span>Total Tasks</span>
                            </Link>
                            <Link to="/tasks?filter=Done" className="report-stat report-stat-link">
                                <span className="report-stat-value text-green">{tasks.filter(t => t.status === 'Done').length}</span>
                                <span>Completed</span>
                            </Link>
                            <Link to="/tasks?filter=In Progress" className="report-stat report-stat-link">
                                <span className="report-stat-value text-amber">{tasks.filter(t => t.status === 'In Progress').length}</span>
                                <span>In Progress</span>
                            </Link>
                            <Link to="/tasks?filter=To-Do" className="report-stat report-stat-link">
                                <span className="report-stat-value text-indigo">{tasks.filter(t => t.status === 'To-Do').length}</span>
                                <span>To-Do</span>
                            </Link>
                            <Link to="/tasks?filter=To-Do" className="report-stat report-stat-link">
                                <span className="report-stat-value" style={{ color: '#ef4444' }}>{tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Done').length}</span>
                                <span>Overdue</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'sales' && (
                <div className="reports-grid">
                    <div className="report-card glass-card">
                        <h3>Leads by Stage</h3>
                        <div className="report-chart"><Bar data={leadsByStage} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }} /></div>
                    </div>
                    <div className="report-card glass-card">
                        <h3>Revenue by Source (₹L)</h3>
                        <div className="report-chart"><Doughnut data={salesBySource} options={doughnutOptions} /></div>
                    </div>
                    <div className="report-card glass-card full-width">
                        <h3>Revenue Forecast</h3>
                        <div className="report-chart wide"><Line data={revenueForecast} options={commonOptions} /></div>
                    </div>
                    <div className="report-card glass-card full-width">
                        <h3>Salesperson Performance</h3>
                        <table className="data-table">
                            <thead>
                                <tr><th>Salesperson</th><th>Leads</th><th>Won</th><th>Lost</th><th>Win Rate</th><th>Revenue</th></tr>
                            </thead>
                            <tbody>
                                {employees.filter(e => e.department === 'Sales').map(emp => {
                                    const empLeads = leads.filter(l => l.assignedTo === emp.id);
                                    const won = empLeads.filter(l => l.status === 'Won').length;
                                    const lost = empLeads.filter(l => l.status === 'Lost').length;
                                    const closed = won + lost;
                                    const rev = empLeads.filter(l => l.status === 'Won').reduce((s, l) => s + l.dealValue, 0);
                                    return (
                                        <tr key={emp.id}>
                                            <td><strong>{emp.name}</strong></td>
                                            <td>{empLeads.length}</td>
                                            <td><span className="badge badge-success">{won}</span></td>
                                            <td><span className="badge badge-danger">{lost}</span></td>
                                            <td>{closed > 0 ? Math.round((won / closed) * 100) : 0}%</td>
                                            <td><strong>₹{(rev / 100000).toFixed(1)}L</strong></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'leaves' && (
                <div className="reports-grid">
                    <div className="report-card glass-card">
                        <h3>Leave by Type</h3>
                        <div className="report-chart"><Doughnut data={leaveByType} options={doughnutOptions} /></div>
                    </div>
                    <div className="report-card glass-card">
                        <h3>Leave Days by Department</h3>
                        <div className="report-chart"><Bar data={leaveByDept} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }} /></div>
                    </div>
                    <div className="report-card glass-card full-width">
                        <h3>Employee Leave Usage</h3>
                        <table className="data-table">
                            <thead>
                                <tr><th>Employee</th><th>Department</th><th>Total Requests</th><th>Days Used</th><th>Pending</th><th>Approved</th></tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => {
                                    const empLeaves = leaves.filter(l => l.employeeId === emp.id);
                                    return (
                                        <tr key={emp.id}>
                                            <td><strong>{emp.name}</strong></td>
                                            <td>{emp.department}</td>
                                            <td>{empLeaves.length}</td>
                                            <td>{empLeaves.filter(l => l.status === 'Approved').reduce((s, l) => s + l.totalDays, 0)}</td>
                                            <td><span className="badge badge-warning">{empLeaves.filter(l => l.status === 'Pending').length}</span></td>
                                            <td><span className="badge badge-success">{empLeaves.filter(l => l.status === 'Approved').length}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
