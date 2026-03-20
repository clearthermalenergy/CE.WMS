import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // ATT001
    employeeId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    
    checkIn: {
        timestamp: { type: Date },
        location: {
            lat: { type: Number },
            lng: { type: Number },
            address: { type: String }
        },
        selfieUrl: { type: String }
    },
    
    checkOut: {
        timestamp: { type: Date },
        location: {
            lat: { type: Number },
            lng: { type: Number },
            address: { type: String }
        },
        selfieUrl: { type: String }
    },
    
    // Continuous tracking data points throughout the day
    routePoints: [{
        timestamp: { type: Date },
        lat: { type: Number },
        lng: { type: Number },
        isWaitPoint: { type: Boolean, default: false },
        waitTimeMinutes: { type: Number, default: 0 }
    }],
    
    // Daily summary stats calculated at checkout
    summary: {
        totalDistanceKm: { type: Number, default: 0 },
        totalWaitTimeMinutes: { type: Number, default: 0 },
        status: { type: String, enum: ['Present', 'Absent', 'Half Day'], default: 'Present' }
    }
}, { timestamps: true });

// Compound index to easily fetch a user's attendance for a specific day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
