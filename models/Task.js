import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
    id: String,
    text: String,
    done: Boolean
});

const commentSchema = new mongoose.Schema({
    author: String, // foreign key to Employee id
    text: String,
    date: String
});

const taskSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    assignedTo: String, // Employee id
    createdBy: String, // Employee id
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    dueDate: String,
    status: { type: String, enum: ['To-Do', 'This Week', 'In Progress', 'Done'], default: 'To-Do' },
    tags: [String],
    subtasks: [subtaskSchema],
    comments: [commentSchema],
    createdAt: String
});

export default mongoose.model('Task', taskSchema);
