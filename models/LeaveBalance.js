import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
    empId: { type: String, required: true, unique: true },
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 10 },
    earned: { type: Number, default: 15 },
    wfh: { type: Number, default: 24 },
    emergency: { type: Number, default: 3 },
    casualUsed: { type: Number, default: 0 },
    sickUsed: { type: Number, default: 0 },
    earnedUsed: { type: Number, default: 0 },
    wfhUsed: { type: Number, default: 0 },
    emergencyUsed: { type: Number, default: 0 }
});

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
