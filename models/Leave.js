import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true },
    leaveType: { type: String, enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Work From Home', 'Emergency Leave'], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalDays: { type: Number, required: true },
    reason: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedOn: String
});

export default mongoose.model('Leave', leaveSchema);
