import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    department: String,
    role: { type: String, enum: ['Admin', 'Manager', 'Employee'], default: 'Employee' },
    manager: String, // foreign key to another employee's id
    joinDate: String,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    password: { type: String, required: true }
}, {
    timestamps: true
});

export default mongoose.model('Employee', employeeSchema);
