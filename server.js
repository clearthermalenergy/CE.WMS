import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import Employee from './models/Employee.js';
import Task from './models/Task.js';
import Lead from './models/Lead.js';
import Leave from './models/Leave.js';
import LeaveBalance from './models/LeaveBalance.js';
import Activity from './models/Activity.js';
import Notification from './models/Notification.js';
import RolePermission from './models/RolePermission.js';

const app = express();
// CONF-01: Add security headers to all responses
app.use(helmet({ contentSecurityPolicy: false }));
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    // In development, use a fallback but warn loudly. In production, crash fast.
    if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
        process.exit(1);
    }
    console.warn('WARNING: JWT_SECRET not set. Using insecure development fallback. DO NOT use in production.');
}
const JWT_SECRET_FINAL = JWT_SECRET || 'ce-wms-dev-only-insecure-fallback';
const JWT_EXPIRY = '24h';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ce-wms';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { runSeed } from './seed.js';

// Connect to MongoDB with fallback to In-Memory DB
(async () => {
    try {
        console.log(`Attempting to connect to MongoDB at ${MONGODB_URI}...`);
        // Fast timeout to quickly fallback if no local DB exists
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.log('⚠️ Could not connect to default MongoDB. Falling back to In-Memory Server...');
        // Start MongoMemoryServer
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to In-Memory MongoDB');

        // Auto-seed the memory database so the app is instantly usable
        await runSeed();
    }
})();

// Configure CORS for production security
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:5173', // Vite dev
        'http://localhost:3000', // Alt frontend
        'http://localhost',      // Capacitor local
        'capacitor://localhost'  // iOS Capacitor
    ];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ============================================
// ID Generator
// ============================================
function generateId(prefix = '') {
    return `${prefix}${Date.now()}`;
}

// ============================================
// AUTHENTICATION
// ============================================

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per window
    message: { error: 'Too many login attempts from this IP, please try again after 5 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

function sanitizeEmployee(emp) {
    if (!emp) return null;
    const safe = emp.toObject ? emp.toObject() : emp;
    delete safe.password;
    return safe;
}

app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        // Case-insensitive regex search for email
        const employee = await Employee.findOne({ email: new RegExp(`^${email}$`, 'i') });
        if (!employee || !bcrypt.compareSync(password, employee.password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (employee.status !== 'Active') {
            return res.status(403).json({ error: 'Account is inactive. Contact admin.' });
        }

        const token = jwt.sign({ id: employee.id, email: employee.email, role: employee.role }, JWT_SECRET_FINAL, { expiresIn: JWT_EXPIRY });

        // Log login activity
        await Activity.create({
            id: generateId('ACT'),
            type: 'login',
            action: 'User logged in',
            detail: `${employee.name} logged in`,
            user: employee.id,
            timestamp: new Date().toISOString()
        });

        res.cookie('ce_wms_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ user: sanitizeEmployee(employee) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        const token = req.cookies.ce_wms_token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
        if (!token) return res.status(401).json({ error: 'No token' });

        const decoded = jwt.verify(token, JWT_SECRET_FINAL);
        const employee = await Employee.findOne({ id: decoded.id });
        if (!employee) return res.status(404).json({ error: 'User not found' });

        res.json({ user: sanitizeEmployee(employee) });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('ce_wms_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
async function authMiddleware(req, res, next) {
    const token = req.cookies.ce_wms_token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    if (!token) return res.status(401).json({ error: 'Auth required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET_FINAL);
        req.user = decoded;
        
        // Load dynamic permissions for this role and attach to req.user
        const rolePerm = await RolePermission.findOne({ role: decoded.role });
        req.user.permissions = rolePerm ? rolePerm.permissions : {};
        
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'Admin' && !req.user.permissions?.full_system_control) return res.status(403).json({ error: 'Admin permission required' });
    next();
}

function requireManageUsers(req, res, next) {
    if (req.user.role !== 'Admin' && !req.user.permissions?.manage_users && !req.user.permissions?.full_system_control) return res.status(403).json({ error: 'Manage Users permission required' });
    next();
}

function requireManageTeamTasks(req, res, next) {
    if (req.user.role !== 'Admin' && !req.user.permissions?.manage_team_tasks && !req.user.permissions?.full_system_control) return res.status(403).json({ error: 'Manage Tasks permission required' });
    next();
}

function requireManageLeads(req, res, next) {
    if (req.user.role !== 'Admin' && !req.user.permissions?.manage_assigned_leads && !req.user.permissions?.full_system_control) return res.status(403).json({ error: 'Manage Leads permission required' });
    next();
}

// BAC-01: Seed endpoint moved AFTER authMiddleware and protected by requireAdmin
// This prevents anonymous users from wiping or re-seeding the production database

app.use('/api', authMiddleware);

// BAC-01 PATCH: Seed DB is now protected — requires Admin token
app.get('/api/seed-db', requireAdmin, async (req, res) => {
    try {
        await runSeed();
        res.json({ success: true, message: 'Database seeded successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to seed database: ' + err.message });
    }
});

// ============================================
// FULL DATA ENDPOINT (for initial load)
// ============================================
app.get('/api/data', async (req, res) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;
        const emp = await Employee.findOne({ id: userId });

        let employeesQuery = {};
        let tasksQuery = {};
        let leadsQuery = {};
        let leavesQuery = {};
        let leaveBalancesQuery = {};
        let activitiesQuery = {};

        const perms = req.user.permissions || {};

        if (userRole === 'Admin' || perms.full_system_control) {
            // Admin sees everything, no filters needed
        } else {
            // Strict personal view by default
            employeesQuery = { id: userId };
            tasksQuery = { $or: [{ assignedTo: userId }, { createdBy: userId }] };
            leadsQuery = { assignedTo: userId };
            leavesQuery = { employeeId: userId };
            leaveBalancesQuery = { empId: userId };
            activitiesQuery = { user: userId };

            // Orthogonal permissions overrides
            if (perms.manage_users) {
                employeesQuery = {};
            }

            const deptEmps = await Employee.find({ department: emp.department });
            const deptEmpIds = deptEmps.map(e => e.id);
            if (!deptEmpIds.includes(userId)) deptEmpIds.push(userId);

            const directReports = await Employee.find({ manager: userId });
            const directReportIds = directReports.map(e => e.id);
            if (!directReportIds.includes(userId)) directReportIds.push(userId);

            if (perms.manage_team_tasks) {
                tasksQuery = { $or: [{ assignedTo: { $in: deptEmpIds } }, { createdBy: { $in: deptEmpIds } }] };
            }

            if (perms.view_all_leads) {
                leadsQuery = {};
            } else if (perms.manage_assigned_leads) {
                leadsQuery = { assignedTo: { $in: deptEmpIds } };
            }

            if (perms.approve_leave) {
                leavesQuery = {}; 
                leaveBalancesQuery = {};
            } else if (directReportIds.length > 1) { 
                // Sees team returns without global approval
                leavesQuery = { employeeId: { $in: directReportIds } };
                leaveBalancesQuery = { empId: { $in: directReportIds } };
            }

            if (perms.manage_users || perms.manage_team_tasks || perms.approve_leave) {
                activitiesQuery = {}; // Elevate activity exposure
            }
        }

        const [employees, tasks, leads, leaves, leaveBalancesArr, activities, notifications, rolePermissions] = await Promise.all([
            Employee.find(employeesQuery).select('-password'),
            Task.find(tasksQuery),
            Lead.find(leadsQuery),
            Leave.find(leavesQuery),
            LeaveBalance.find(leaveBalancesQuery),
            Activity.find(activitiesQuery).sort({ timestamp: -1 }).limit((userRole === 'Admin' || perms.full_system_control) ? 50 : 20),
            Notification.find({ userId: req.user.id }).sort({ timestamp: -1 }),
            RolePermission.find()
        ]);

        // Convert leaveBalances array to object keyed by empId for frontend compatibility
        const leaveBalances = {};
        leaveBalancesArr.forEach(lb => {
            const { empId, _id, __v, ...rest } = lb.toObject();
            leaveBalances[empId] = rest;
        });

        res.json({
            employees, tasks, leads, leaves, leaveBalances, activities, notifications, rolePermissions,
            currentUser: req.user.id
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// BAC-03 PATCH: Only Admins can reset/re-seed the database
app.post('/api/data/reset', requireAdmin, async (req, res) => {
    try {
        await runSeed();
        res.json({ success: true, message: 'Database seeded successfully on live server!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to seed database' });
    }
});

// ============================================
// EMPLOYEES
// ============================================
app.get('/api/employees', async (req, res) => {
    const users = await Employee.find().select('-password');
    res.json(users);
});

app.get('/api/employees/:id', async (req, res) => {
    const emp = await Employee.findOne({ id: req.params.id }).select('-password');
    if (!emp) return res.status(404).json({ error: 'Not found' });
    res.json(emp);
});

app.post('/api/employees', requireManageUsers, async (req, res) => {
    const newEmp = new Employee({
        ...req.body,
        id: generateId('EMP'),
        password: bcrypt.hashSync(req.body.password || 'Welcome@123', 10)
    });
    await newEmp.save();
    res.status(201).json(sanitizeEmployee(newEmp));
});

app.put('/api/employees/:id', requireManageUsers, async (req, res) => {
    const data = { ...req.body };
    if (data.password) {
        data.password = bcrypt.hashSync(data.password, 10);
    }
    const emp = await Employee.findOneAndUpdate({ id: req.params.id }, data, { new: true }).select('-password');
    res.json(emp);
});

app.delete('/api/employees/:id', requireManageUsers, async (req, res) => {
    await Employee.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

// ============================================
// TASKS
// ============================================
app.get('/api/tasks', async (req, res) => res.json(await Task.find()));
app.get('/api/tasks/:id', async (req, res) => res.json(await Task.findOne({ id: req.params.id })));

app.post('/api/tasks', async (req, res) => {
    if (req.user.role === 'Employee' && req.body.assignedTo !== req.user.id && req.body.createdBy !== req.user.id) {
        return res.status(403).json({ error: 'Employees can only create tasks for themselves' });
    }
    const newTask = new Task({
        ...req.body,
        id: generateId('TSK'),
        createdAt: new Date().toISOString()
    });
    await newTask.save();

    await Activity.create({
        id: generateId('ACT'), type: 'task', action: 'Task created', detail: newTask.title, user: req.user.id, timestamp: new Date().toISOString()
    });
    res.status(201).json(newTask);
});

// BAC-02 PATCH: Verify the requester owns or has permission to modify this task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ id: req.params.id });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const perms = req.user.permissions || {};
        const isAdmin = req.user.role === 'Admin' || perms.full_system_control;
        const isOwner = task.assignedTo === req.user.id || task.createdBy === req.user.id;
        const canManageTeam = !!perms.manage_team_tasks;

        if (!isAdmin && !isOwner && !canManageTeam) {
            return res.status(403).json({ error: 'You do not have permission to update this task' });
        }

        const updated = await Task.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/tasks/:id', requireManageTeamTasks, async (req, res) => {
    await Task.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

// ============================================
// LEADS
// ============================================
app.get('/api/leads', async (req, res) => res.json(await Lead.find()));
app.get('/api/leads/:id', async (req, res) => res.json(await Lead.findOne({ id: req.params.id })));

app.post('/api/leads', requireManageLeads, async (req, res) => {
    const newLead = new Lead({ ...req.body, id: generateId('LD'), createdAt: new Date().toISOString() });
    await newLead.save();
    await Activity.create({
        id: generateId('ACT'), type: 'lead', action: 'New lead created', detail: newLead.companyName, user: req.user.id, timestamp: new Date().toISOString()
    });
    res.status(201).json(newLead);
});

app.put('/api/leads/:id', requireManageLeads, async (req, res) => res.json(await Lead.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })));
app.delete('/api/leads/:id', requireAdmin, async (req, res) => { await Lead.findOneAndDelete({ id: req.params.id }); res.json({ success: true }); });

// ============================================
// LEAVES
// ============================================
app.get('/api/leaves', async (req, res) => res.json(await Leave.find()));
app.get('/api/leaves/:id', async (req, res) => res.json(await Leave.findOne({ id: req.params.id })));

app.post('/api/leaves', async (req, res) => {
    // Only apply for oneself
    if (req.user.role === 'Employee' && req.body.employeeId !== req.user.id) {
        return res.status(403).json({ error: 'Employees can only apply for their own leaves' });
    }
    const newLeave = new Leave({ ...req.body, id: generateId('LV'), appliedOn: new Date().toISOString(), status: 'Pending' });
    await newLeave.save();
    const emp = await Employee.findOne({ id: newLeave.employeeId });
    await Activity.create({
        id: generateId('ACT'), type: 'leave', action: 'Leave applied', detail: `${emp ? emp.name : newLeave.employeeId} - ${newLeave.leaveType}`, user: newLeave.employeeId, timestamp: new Date().toISOString()
    });
    res.status(201).json(newLeave);
});

app.put('/api/leaves/:id', async (req, res) => {
    // Check permission logic
    if (req.user.role !== 'Admin' && !req.user.permissions?.approve_leave && !req.user.permissions?.full_system_control && req.body.status !== 'Pending') {
        const existing = await Leave.findOne({ id: req.params.id });
        if (existing && existing.status !== req.body.status) {
            return res.status(403).json({ error: 'Permission required to approve/reject leaves' });
        }
    }
    res.json(await Leave.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }))
});

// ============================================
// SETTINGS
// ============================================
app.put('/api/settings/roles', requireAdmin, async (req, res) => {
    const { role, permissions } = req.body;
    const rp = await RolePermission.findOneAndUpdate({ role }, { permissions }, { new: true, upsert: true });
    res.json(rp);
});

// ============================================
// LEAVE BALANCES
// ============================================
app.get('/api/leave-balances', async (req, res) => {
    const arr = await LeaveBalance.find();
    const obj = {};
    arr.forEach(lb => {
        const { empId, _id, __v, ...rest } = lb.toObject();
        obj[empId] = rest;
    });
    res.json(obj);
});

app.get('/api/leave-balances/:empId', async (req, res) => {
    const lb = await LeaveBalance.findOne({ empId: req.params.empId });
    if (!lb) return res.status(404).json({ error: 'Not found' });
    const { empId, _id, __v, ...rest } = lb.toObject();
    res.json(rest);
});

// ============================================
// ACTIVITIES
// ============================================
app.get('/api/activities', async (req, res) => res.json(await Activity.find().sort({ timestamp: -1 })));
app.post('/api/activities', async (req, res) => {
    const act = new Activity({ ...req.body, id: generateId('ACT'), timestamp: new Date().toISOString() });
    await act.save();
    res.status(201).json(act);
});

// ============================================
// NOTIFICATIONS
// ============================================
app.get('/api/notifications', async (req, res) => {
    // Only return notifications for the current user
    res.json(await Notification.find({ userId: req.user.id }).sort({ timestamp: -1 }));
});

app.post('/api/notifications', async (req, res) => {
    const notif = new Notification({ ...req.body, id: generateId('NT'), read: false, timestamp: new Date().toISOString() });
    await notif.save();
    res.status(201).json(notif);
});

app.put('/api/notifications/mark-all-read', async (req, res) => {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
});

app.put('/api/notifications/:id', async (req, res) => res.json(await Notification.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })));

// ============================================
// SERVE FRONTEND BUILD (Production Web App)
// ============================================
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve standard files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve `index.html` for any unmatched route (React Router handling)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`✅ CE-WMS MongoDB API running on http://localhost:${PORT}`);
});
