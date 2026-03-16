import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { getInitials, getAvatarColor, formatDate } from '../store/data';
import {
    Plus, Search, Edit2, Trash2, X, Eye, Phone, Mail, MapPin, Building,
    DollarSign, ChevronRight, Filter, ArrowUpRight
} from 'lucide-react';
import './Leads.css';

const STAGES = ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const STAGE_COLORS = {
    'New Lead': '#6366f1',
    'Contacted': '#3b82f6',
    'Qualified': '#8b5cf6',
    'Proposal Sent': '#f59e0b',
    'Negotiation': '#f97316',
    'Won': '#06d6a0',
    'Lost': '#ef4444',
};
const SOURCES = ['Website', 'Referral', 'Cold call', 'Advertisement'];

export default function Leads() {
    const { data, store } = useStore();
    const { leads, employees } = data;
    const [view, setView] = useState('pipeline'); // pipeline or table
    const [showModal, setShowModal] = useState(false);
    const [editLead, setEditLead] = useState(null);
    const [viewLead, setViewLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStage, setFilterStage] = useState('All');
    const [filterSource, setFilterSource] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const filteredLeads = leads.filter(l => {
        if (searchTerm && !l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) && !l.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterStage !== 'All' && l.status !== filterStage) return false;
        if (filterSource !== 'All' && l.leadSource !== filterSource) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
    const paginatedLeads = view === 'table' ? filteredLeads.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) : filteredLeads;

    const formatCurrency = (val) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
        return `₹${val}`;
    };

    const pipelineTotal = filteredLeads.filter(l => !['Won', 'Lost'].includes(l.status)).reduce((s, l) => s + l.dealValue, 0);
    const wonTotal = filteredLeads.filter(l => l.status === 'Won').reduce((s, l) => s + l.dealValue, 0);

    const handleSave = (leadData) => {
        if (editLead) {
            store.updateLead(editLead.id, leadData);
        } else {
            store.addLead(leadData);
        }
        setShowModal(false);
        setEditLead(null);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this lead?')) store.deleteLead(id);
    };

    return (
        <div className="leads-page animate-in">
            <div className="page-header">
                <div>
                    <h1>Sales Pipeline</h1>
                    <p>Track and manage your sales leads</p>
                </div>
                <div className="page-actions">
                    <div className="view-toggle">
                        <button className={`view-btn ${view === 'pipeline' ? 'active' : ''}`} onClick={() => setView('pipeline')}>Pipeline</button>
                        <button className={`view-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>Table</button>
                    </div>
                    <button className="btn btn-primary" id="btn-add-lead" onClick={() => { setEditLead(null); setShowModal(true); }}>
                        <Plus size={18} /> Add Lead
                    </button>
                </div>
            </div>

            {/* Lead Stats */}
            <div className="lead-stats-bar">
                <div className="lead-stat">
                    <span className="lead-stat-label">Total Leads</span>
                    <span className="lead-stat-value">{filteredLeads.length}</span>
                </div>
                <div className="lead-stat-divider" />
                <div className="lead-stat">
                    <span className="lead-stat-label">Pipeline Value</span>
                    <span className="lead-stat-value text-blue">{formatCurrency(pipelineTotal)}</span>
                </div>
                <div className="lead-stat-divider" />
                <div className="lead-stat">
                    <span className="lead-stat-label">Won Value</span>
                    <span className="lead-stat-value text-green">{formatCurrency(wonTotal)}</span>
                </div>
                <div className="lead-stat-divider" />
                <div className="lead-stat">
                    <span className="lead-stat-label">Conversion</span>
                    <span className="lead-stat-value text-indigo">
                        {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'Won').length / leads.length) * 100) : 0}%
                    </span>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input type="text" placeholder="Search leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="filter-select" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
                    <option value="All">All Stages</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="filter-select" value={filterSource} onChange={e => { setFilterSource(e.target.value); setCurrentPage(1); }}>
                    <option value="All">All Sources</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {view === 'pipeline' ? (
                <div className="pipeline-board">
                    {STAGES.map(stage => {
                        const stageLeads = filteredLeads.filter(l => l.status === stage);
                        const stageTotal = stageLeads.reduce((s, l) => s + l.dealValue, 0);
                        return (
                            <div key={stage} className="pipeline-column">
                                <div className="pipeline-header">
                                    <div className="pipeline-title">
                                        <div className="pipeline-dot" style={{ background: STAGE_COLORS[stage] }} />
                                        <span>{stage}</span>
                                        <span className="column-count">{stageLeads.length}</span>
                                    </div>
                                    <span className="pipeline-total">{formatCurrency(stageTotal)}</span>
                                </div>
                                <div className="pipeline-cards">
                                    {stageLeads.map(lead => (
                                        <div key={lead.id} className="lead-card" onClick={() => setViewLead(lead)}>
                                            <div className="lead-card-top">
                                                <h4>{lead.companyName}</h4>
                                                <span className="lead-card-value">{formatCurrency(lead.dealValue)}</span>
                                            </div>
                                            <div className="lead-card-person">
                                                <div className="avatar avatar-sm" style={{ background: getAvatarColor(lead.contactPerson), color: '#fff' }}>
                                                    {getInitials(lead.contactPerson)}
                                                </div>
                                                <span>{lead.contactPerson}</span>
                                            </div>
                                            <div className="lead-card-meta">
                                                <span><MapPin size={12} /> {lead.location}</span>
                                                <span><Building size={12} /> {lead.industry}</span>
                                            </div>
                                            {lead.nextFollowUp && (
                                                <div className="lead-card-followup">
                                                    Next: {formatDate(lead.nextFollowUp)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Contact</th>
                                <th>Stage</th>
                                <th>Value</th>
                                <th>Source</th>
                                <th>Assigned</th>
                                <th>Follow-up</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLeads.map(lead => (
                                <tr key={lead.id}>
                                    <td>
                                        <div className="lead-company-cell">
                                            <strong>{lead.companyName}</strong>
                                            <span>{lead.location}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="lead-contact-cell">
                                            <span>{lead.contactPerson}</span>
                                            <span className="text-muted">{lead.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="stage-badge" style={{ background: `${STAGE_COLORS[lead.status]}20`, color: STAGE_COLORS[lead.status] }}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td><strong>{formatCurrency(lead.dealValue)}</strong></td>
                                    <td>{lead.leadSource}</td>
                                    <td>
                                        <div className="avatar avatar-sm" style={{ background: getAvatarColor(store.getEmployeeName(lead.assignedTo)), color: '#fff' }} title={store.getEmployeeName(lead.assignedTo)}>
                                            {getInitials(store.getEmployeeName(lead.assignedTo))}
                                        </div>
                                    </td>
                                    <td>{lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '—'}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-ghost" onClick={() => setViewLead(lead)}><Eye size={16} /></button>
                                            <button className="btn-ghost" onClick={() => { setEditLead(lead); setShowModal(true); }}><Edit2 size={16} /></button>
                                            <button className="btn-ghost" onClick={() => handleDelete(lead.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {totalPages > 1 && (
                        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '15px' }}>
                            <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                            <span style={{ fontSize: '0.875rem', alignSelf: 'center', color: 'var(--text-secondary)' }}>Page {currentPage} of {totalPages}</span>
                            <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                        </div>
                    )}
                </div>
            )}

            {/* Lead Detail View */}
            {viewLead && (
                <div className="modal-overlay" onClick={() => setViewLead(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>{viewLead.companyName}</h2>
                            <button className="btn-ghost" onClick={() => setViewLead(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="lead-detail-grid">
                                <div className="lead-detail-item">
                                    <label>Contact Person</label>
                                    <span>{viewLead.contactPerson}</span>
                                </div>
                                <div className="lead-detail-item">
                                    <label>Phone</label>
                                    <span>{viewLead.phone}</span>
                                </div>
                                <div className="lead-detail-item">
                                    <label>Email</label>
                                    <span>{viewLead.email}</span>
                                </div>
                                <div className="lead-detail-item">
                                    <label>Industry</label>
                                    <span>{viewLead.industry}</span>
                                </div>
                                <div className="lead-detail-item">
                                    <label>Location</label>
                                    <span>{viewLead.location}</span>
                                </div>
                                <div className="lead-detail-item">
                                    <label>Source</label>
                                    <span>{viewLead.leadSource}</span>
                                </div>
                                <div className="lead-detail-item">
                                    <label>Deal Value</label>
                                    <span className="lead-detail-value">{formatCurrency(viewLead.dealValue)}</span>
                                </div>
                                <div className="lead-detail-item">
                                    <label>Stage</label>
                                    <span className="stage-badge" style={{ background: `${STAGE_COLORS[viewLead.status]}20`, color: STAGE_COLORS[viewLead.status] }}>{viewLead.status}</span>
                                </div>
                                <div className="lead-detail-item full">
                                    <label>Assigned To</label>
                                    <span>{store.getEmployeeName(viewLead.assignedTo)}</span>
                                </div>
                                <div className="lead-detail-item full">
                                    <label>Notes</label>
                                    <p>{viewLead.notes || 'No notes'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setViewLead(null)}>Close</button>
                            <button className="btn btn-primary" onClick={() => { setEditLead(viewLead); setViewLead(null); setShowModal(true); }}>
                                <Edit2 size={16} /> Edit Lead
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <LeadModal
                    lead={editLead}
                    employees={employees}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditLead(null); }}
                />
            )}
        </div>
    );
}

function LeadModal({ lead, employees, onSave, onClose }) {
    const [form, setForm] = useState({
        companyName: lead?.companyName || '',
        contactPerson: lead?.contactPerson || '',
        phone: lead?.phone || '',
        email: lead?.email || '',
        industry: lead?.industry || '',
        location: lead?.location || '',
        leadSource: lead?.leadSource || 'Website',
        dealValue: lead?.dealValue || '',
        assignedTo: lead?.assignedTo || '',
        status: lead?.status || 'New Lead',
        nextFollowUp: lead?.nextFollowUp || '',
        notes: lead?.notes || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...form, dealValue: Number(form.dealValue) || 0 });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                <div className="modal-header">
                    <h2>{lead ? 'Edit Lead' : 'New Lead'}</h2>
                    <button className="btn-ghost" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Company Name *</label>
                                <input type="text" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Person *</label>
                                <input type="text" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Industry</label>
                                <input type="text" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Lead Source</label>
                                <select value={form.leadSource} onChange={e => setForm(f => ({ ...f, leadSource: e.target.value }))}>
                                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deal Value (₹)</label>
                                <input type="number" value={form.dealValue} onChange={e => setForm(f => ({ ...f, dealValue: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Assigned To</label>
                                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                                    <option value="">Select salesperson</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Stage</label>
                                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Next Follow-up</label>
                            <input type="date" value={form.nextFollowUp} onChange={e => setForm(f => ({ ...f, nextFollowUp: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add notes..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{lead ? 'Update Lead' : 'Create Lead'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
