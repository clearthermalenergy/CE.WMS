import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
    role: { type: String, required: true, unique: true }, // 'Admin', 'Manager', 'Employee'
    permissions: {
        full_system_control: { type: Boolean, default: false },
        manage_team_tasks: { type: Boolean, default: false },
        personal_tasks: { type: Boolean, default: true },
        view_all_leads: { type: Boolean, default: false },
        manage_assigned_leads: { type: Boolean, default: true },
        approve_leave: { type: Boolean, default: false },
        apply_leave: { type: Boolean, default: true },
        view_reports: { type: Boolean, default: false },
        manage_users: { type: Boolean, default: false },
    }
});

export default mongoose.model('RolePermission', rolePermissionSchema);
