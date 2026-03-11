import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import Employee from './models/Employee.js';
import Task from './models/Task.js';
import Lead from './models/Lead.js';
import Leave from './models/Leave.js';
import LeaveBalance from './models/LeaveBalance.js';
import Activity from './models/Activity.js';
import Notification from './models/Notification.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'ce-wms-secret-key-change-in-production';
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

// ============================================
// ID Generator
// ============================================
function generateId(prefix = '') {
    return `${prefix}${Date.now()}`;
}

// ============================================
// AUTHENTICATION
// ============================================
function sanitizeEmployee(emp) {
    if (!emp) return null;
    const safe = emp.toObject ? emp.toObject() : emp;
    delete safe.password;
    return safe;
}

app.post('/api/auth/login', async (req, res) => {
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

        const token = jwt.sign({ id: employee.id, email: employee.email, role: employee.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        // Log login activity
        await Activity.create({
            id: generateId('ACT'),
            type: 'login',
            action: 'User logged in',
            detail: `${employee.name} logged in`,
            user: employee.id,
            timestamp: new Date().toISOString()
        });

        res.json({ token, user: sanitizeEmployee(employee) });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const employee = await Employee.findOne({ id: decoded.id });
        if (!employee) return res.status(404).json({ error: 'User not found' });

        res.json({ user: sanitizeEmployee(employee) });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });

    try {
        req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

app.use('/api', authMiddleware);

// ============================================
// FULL DATA ENDPOINT (for initial load)
// ============================================
app.get('/api/data', async (req, res) => {
    try {
        const [employees, tasks, leads, leaves, leaveBalancesArr, activities, notifications] = await Promise.all([
            Employee.find().select('-password'),
            Task.find(),
            Lead.find(),
            Leave.find(),
            LeaveBalance.find(),
            Activity.find().sort({ timestamp: -1 }).limit(50),
            Notification.find().sort({ timestamp: -1 })
        ]);

        // Convert leaveBalances array to object keyed by empId for frontend compatibility
        const leaveBalances = {};
        leaveBalancesArr.forEach(lb => {
            const { empId, _id, __v, ...rest } = lb.toObject();
            leaveBalances[empId] = rest;
        });

        res.json({
            employees, tasks, leads, leaves, leaveBalances, activities, notifications,
            currentUser: req.user.id
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Data reset (just re-seed by invoking seed script logic, or return a message saying to run seed.js)
app.post('/api/data/reset', (req, res) => {
    res.status(400).json({ error: 'Data reset disabled in DB mode. Run `npm run seed` manually.' });
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

app.post('/api/employees', async (req, res) => {
    const newEmp = new Employee({
        ...req.body,
        id: generateId('EMP'),
        password: bcrypt.hashSync(req.body.password || 'Welcome@123', 10)
    });
    await newEmp.save();
    res.status(201).json(sanitizeEmployee(newEmp));
});

app.put('/api/employees/:id', async (req, res) => {
    const data = { ...req.body };
    if (data.password) {
        data.password = bcrypt.hashSync(data.password, 10);
    }
    const emp = await Employee.findOneAndUpdate({ id: req.params.id }, data, { new: true }).select('-password');
    res.json(emp);
});

app.delete('/api/employees/:id', async (req, res) => {
    await Employee.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

// ============================================
// TASKS
// ============================================
app.get('/api/tasks', async (req, res) => res.json(await Task.find()));
app.get('/api/tasks/:id', async (req, res) => res.json(await Task.findOne({ id: req.params.id })));

app.post('/api/tasks', async (req, res) => {
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

app.put('/api/tasks/:id', async (req, res) => {
    const task = await Task.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(task);
});

app.delete('/api/tasks/:id', async (req, res) => {
    await Task.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

// ============================================
// LEADS
// ============================================
app.get('/api/leads', async (req, res) => res.json(await Lead.find()));
app.get('/api/leads/:id', async (req, res) => res.json(await Lead.findOne({ id: req.params.id })));

app.post('/api/leads', async (req, res) => {
    const newLead = new Lead({ ...req.body, id: generateId('LD'), createdAt: new Date().toISOString() });
    await newLead.save();
    await Activity.create({
        id: generateId('ACT'), type: 'lead', action: 'New lead created', detail: newLead.companyName, user: req.user.id, timestamp: new Date().toISOString()
    });
    res.status(201).json(newLead);
});

app.put('/api/leads/:id', async (req, res) => res.json(await Lead.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })));
app.delete('/api/leads/:id', async (req, res) => { await Lead.findOneAndDelete({ id: req.params.id }); res.json({ success: true }); });

// ============================================
// LEAVES
// ============================================
app.get('/api/leaves', async (req, res) => res.json(await Leave.find()));
app.get('/api/leaves/:id', async (req, res) => res.json(await Leave.findOne({ id: req.params.id })));

app.post('/api/leaves', async (req, res) => {
    const newLeave = new Leave({ ...req.body, id: generateId('LV'), appliedOn: new Date().toISOString(), status: 'Pending' });
    await newLeave.save();
    const emp = await Employee.findOne({ id: newLeave.employeeId });
    await Activity.create({
        id: generateId('ACT'), type: 'leave', action: 'Leave applied', detail: `${emp ? emp.name : newLeave.employeeId} - ${newLeave.leaveType}`, user: newLeave.employeeId, timestamp: new Date().toISOString()
    });
    res.status(201).json(newLeave);
});

app.put('/api/leaves/:id', async (req, res) => res.json(await Leave.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })));

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
