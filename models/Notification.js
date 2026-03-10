import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    type: { type: String, enum: ['task', 'lead', 'leave', 'system'], required: true },
    message: { type: String, required: true },
    userId: { type: String, required: true }, // Employee id
    read: { type: Boolean, default: false },
    timestamp: String
});

export default mongoose.model('Notification', notificationSchema);
