import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    contactPerson: String,
    phone: String,
    email: String,
    industry: String,
    location: String,
    leadSource: String,
    dealValue: Number,
    assignedTo: String, // Employee id
    status: { type: String, enum: ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'], default: 'New Lead' },
    nextFollowUp: String,
    notes: String,
    createdAt: String
});

export default mongoose.model('Lead', leadSchema);
