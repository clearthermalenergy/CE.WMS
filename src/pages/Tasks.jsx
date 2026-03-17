import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getInitials, getAvatarColor, formatDate, isOverdue, isToday } from '../store/data';
import {
    Plus, MoreVertical, Calendar, User, MessageSquare, Paperclip,
    CheckSquare, Edit2, Trash2, X, ChevronDown, ChevronUp, Search, Filter
} from 'lucide-react';
import './Tasks.css';

const COLUMNS = [
    { id: 'To-Do', title: 'To-Do', color: '#6366f1' },
    { id: 'This Week', title: 'This Week', color: '#3b82f6' },
    { id: 'In Progress', title: 'In Progress', color: '#f59e0b' },
    { id: 'Done', title: 'Done', color: '#06d6a0' },
];

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function Tasks() {
    const { data, store } = useStore();
    const { tasks, employees } = data;
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [expandedCard, setExpandedCard] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterAssignee, setFilterAssignee] = useState('All');
    const [highlightColumn, setHighlightColumn] = useState(null);
    const [searchParams] = useSearchParams();

    // Auto-apply filter from URL query param (e.g. ?filter=To-Do)
    useEffect(() => {
        const f = searchParams.get('filter');
        if (!f) return;
        if (f === 'due-today') {
            // No column filter — just search today's due tasks visually
            setHighlightColumn('due-today');
        } else {
            setHighlightColumn(f);
        }
        // Scroll to that column after render
        setTimeout(() => {
            const el = document.getElementById(`col-${f}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }, [searchParams]);

    const filteredTasks = tasks.filter(t => {
        if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
        if (filterAssignee !== 'All' && t.assignedTo !== filterAssignee) return false;
        // 'due-today' highlight: only show tasks due today across all columns
        if (highlightColumn === 'due-today' && !isToday(t.dueDate)) return false;
        return true;
    });

    const getColumnTasks = (status) => filteredTasks.filter(t => t.status === status);

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const taskId = result.draggableId;
        const newStatus = result.destination.droppableId;
        store.updateTask(taskId, { status: newStatus });
        if (newStatus === 'Done') {
            store.addActivity('task', 'Task completed', tasks.find(t => t.id === taskId)?.title, data.currentUser);
        }
    };

    const handleSave = (taskData) => {
        if (editTask) {
            store.updateTask(editTask.id, taskData);
        } else {
            store.addTask(taskData);
        }
        setShowModal(false);
        setEditTask(null);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this task?')) store.deleteTask(id);
    };

    const toggleSubtask = (taskId, subtaskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedSubtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s);
        store.updateTask(taskId, { subtasks: updatedSubtasks });
    };

    return (
        <div className="tasks-page animate-in">
            <div className="page-header">
                <div>
                    <h1>Task Board</h1>
                    <p>Manage and track your team's tasks</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" id="btn-add-task" onClick={() => { setEditTask(null); setShowModal(true); }}>
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="All">All Priorities</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select className="filter-select" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                    <option value="All">All Members</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-board">
                    {COLUMNS.map(col => (
                        <Droppable key={col.id} droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    id={`col-${col.id}`}
                                    className={`kanban-column ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${highlightColumn === col.id ? 'column-highlighted' : ''}`}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    <div className="column-header">
                                        <div className="column-title">
                                            <div className="column-dot" style={{ background: col.color }} />
                                            <span>{col.title}</span>
                                            <span className="column-count">{getColumnTasks(col.id).length}</span>
                                        </div>
                                        <button className="btn-ghost" onClick={() => { setEditTask(null); setShowModal(true); }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    <div className="column-cards">
                                        {getColumnTasks(col.id).map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        className={`task-card ${snapshot.isDragging ? 'dragging' : ''} ${isOverdue(task.dueDate) && task.status !== 'Done' ? 'overdue' : ''}`}
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                    >
                                                        <div className="task-card-top">
                                                            <div className="task-tags">
                                                                {task.tags?.slice(0, 2).map(tag => (
                                                                    <span key={tag} className="task-tag">{tag}</span>
                                                                ))}
                                                            </div>
                                                            <div className="task-card-actions">
                                                                <button className="btn-ghost" onClick={() => { setEditTask(task); setShowModal(true); }}><Edit2 size={14} /></button>
                                                                <button className="btn-ghost" onClick={() => handleDelete(task.id)}><Trash2 size={14} /></button>
                                                            </div>
                                                        </div>

                                                        <h4 className="task-card-title">{task.title}</h4>

                                                        {task.description && (
                                                            <p className="task-card-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>
                                                        )}

                                                        {task.subtasks?.length > 0 && (
                                                            <div className="task-subtasks-preview">
                                                                <CheckSquare size={14} />
                                                                <span>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
                                                                <div className="progress-bar" style={{ flex: 1 }}>
                                                                    <div
                                                                        className="progress-fill green"
                                                                        style={{ width: `${(task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {expandedCard === task.id && task.subtasks?.length > 0 && (
                                                            <div className="task-subtasks-list">
                                                                {task.subtasks.map(st => (
                                                                    <label key={st.id} className="subtask-item">
                                                                        <input type="checkbox" checked={st.done} onChange={() => toggleSubtask(task.id, st.id)} />
                                                                        <span className={st.done ? 'done' : ''}>{st.text}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="task-card-footer">
                                                            <div className="task-card-meta">
                                                                <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                                                                {task.dueDate && (
                                                                    <span className={`task-due ${isOverdue(task.dueDate) && task.status !== 'Done' ? 'overdue' : ''}`}>
                                                                        <Calendar size={12} /> {formatDate(task.dueDate)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="task-card-bottom-right">
                                                                {task.comments?.length > 0 && (
                                                                    <span className="task-meta-icon"><MessageSquare size={12} /> {task.comments.length}</span>
                                                                )}
                                                                {task.subtasks?.length > 0 && (
                                                                    <button className="btn-ghost" onClick={() => setExpandedCard(expandedCard === task.id ? null : task.id)}>
                                                                        {expandedCard === task.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                    </button>
                                                                )}
                                                                <div
                                                                    className="avatar avatar-sm"
                                                                    style={{ background: getAvatarColor(store.getEmployeeName(task.assignedTo)), color: '#fff' }}
                                                                    title={store.getEmployeeName(task.assignedTo)}
                                                                >
                                                                    {getInitials(store.getEmployeeName(task.assignedTo))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

            {showModal && (
                <TaskModal
                    task={editTask}
                    employees={employees}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditTask(null); }}
                />
            )}
        </div>
    );
}

function TaskModal({ task, employees, onSave, onClose }) {
    const [form, setForm] = useState({
        title: task?.title || '',
        description: task?.description || '',
        assignedTo: task?.assignedTo || '',
        priority: task?.priority || 'Medium',
        dueDate: task?.dueDate || '',
        status: task?.status || 'To-Do',
        tags: task?.tags?.join(', ') || '',
        subtasks: task?.subtasks || [],
    });
    const [newSubtask, setNewSubtask] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            createdBy: task?.createdBy || 'EMP006',
        });
    };

    const addSubtask = () => {
        if (!newSubtask.trim()) return;
        setForm(f => ({ ...f, subtasks: [...f.subtasks, { id: `s${Date.now()}`, text: newSubtask.trim(), done: false }] }));
        setNewSubtask('');
    };

    const removeSubtask = (id) => {
        setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== id) }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>{task ? 'Edit Task' : 'New Task'}</h2>
                    <button className="btn-ghost" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Task Title *</label>
                            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Enter task title" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the task..." />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Assigned To</label>
                                <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                                    <option value="">Select employee</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="To-Do">To-Do</option>
                                    <option value="This Week">This Week</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tags (comma separated)</label>
                            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. Sales, Report" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Subtasks / Checklist</label>
                            <div className="subtask-input-row">
                                <input type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add a subtask..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())} />
                                <button type="button" className="btn btn-secondary btn-sm" onClick={addSubtask}>Add</button>
                            </div>
                            {form.subtasks.length > 0 && (
                                <div className="subtask-list-edit">
                                    {form.subtasks.map(st => (
                                        <div key={st.id} className="subtask-edit-item">
                                            <CheckSquare size={14} />
                                            <span>{st.text}</span>
                                            <button type="button" className="btn-ghost" onClick={() => removeSubtask(st.id)}><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{task ? 'Update Task' : 'Create Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
