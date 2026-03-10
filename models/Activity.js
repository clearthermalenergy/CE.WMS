import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ['task', 'lead', 'leave', 'login', 'user'], required: true },
    action: { type: String, required: true },
    detail: String,
    user: String, // Employee id
    timestamp: String
});

export default mongoose.model('Activity', activitySchema);
