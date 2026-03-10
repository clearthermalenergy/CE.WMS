import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Employee from './models/Employee.js';
import Task from './models/Task.js';
import Lead from './models/Lead.js';
import Leave from './models/Leave.js';
import LeaveBalance from './models/LeaveBalance.js';
import Activity from './models/Activity.js';
import Notification from './models/Notification.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ce-wms';

// Store original data here for seeding
const defaultPasswordHash = bcrypt.hashSync('Welcome@123', 10);

const seedData = {
    employees: [
        { id: 'EMP001', name: 'Rajesh Kumar', email: 'rajesh@clearenergy.in', phone: '+91 98765 43210', department: 'Sales', role: 'Manager', manager: '', joinDate: '2022-03-15', status: 'Active', password: defaultPasswordHash },
        { id: 'EMP002', name: 'Priya Sharma', email: 'priya@clearenergy.in', phone: '+91 87654 32109', department: 'Sales', role: 'Employee', manager: 'EMP001', joinDate: '2023-01-10', status: 'Active', password: defaultPasswordHash },
        { id: 'EMP003', name: 'Amit Patel', email: 'amit@clearenergy.in', phone: '+91 76543 21098', department: 'Engineering', role: 'Manager', manager: '', joinDate: '2022-06-20', status: 'Active', password: defaultPasswordHash },
        { id: 'EMP004', name: 'Sneha Reddy', email: 'sneha@clearenergy.in', phone: '+91 65432 10987', department: 'Engineering', role: 'Employee', manager: 'EMP003', joinDate: '2023-05-12', status: 'Active', password: defaultPasswordHash },
        { id: 'EMP005', name: 'Vikram Singh', email: 'vikram@clearenergy.in', phone: '+91 54321 09876', department: 'Marketing', role: 'Employee', manager: 'EMP001', joinDate: '2023-08-01', status: 'Active', password: defaultPasswordHash },
        { id: 'EMP006', name: 'Ananya Desai', email: 'ananya@clearenergy.in', phone: '+91 43210 98765', department: 'HR', role: 'Admin', manager: '', joinDate: '2021-11-05', status: 'Active', password: defaultPasswordHash },
        { id: 'EMP007', name: 'Karthik Nair', email: 'karthik@clearenergy.in', phone: '+91 32109 87654', department: 'Sales', role: 'Employee', manager: 'EMP001', joinDate: '2024-01-15', status: 'Active', password: defaultPasswordHash },
        { id: 'EMP008', name: 'Meera Joshi', email: 'meera@clearenergy.in', phone: '+91 21098 76543', department: 'Engineering', role: 'Employee', manager: 'EMP003', joinDate: '2024-03-01', status: 'Active', password: defaultPasswordHash },
    ],

    tasks: [
        { id: 'TSK001', title: 'Prepare Q1 Sales Report', description: 'Compile all sales data for Q1 and prepare a comprehensive report for management review.', assignedTo: 'EMP002', createdBy: 'EMP001', priority: 'High', dueDate: '2026-03-10', status: 'In Progress', tags: ['Sales', 'Report'], subtasks: [{ id: 's1', text: 'Collect data from CRM', done: true }, { id: 's2', text: 'Create charts', done: false }, { id: 's3', text: 'Write summary', done: false }], comments: [{ author: 'EMP001', text: 'Please prioritize this', date: '2026-03-05T10:30:00' }], createdAt: '2026-03-01T09:00:00' },
        { id: 'TSK002', title: 'Update Company Website', description: 'Refresh the landing page with new product information and testimonials.', assignedTo: 'EMP004', createdBy: 'EMP003', priority: 'Medium', dueDate: '2026-03-15', status: 'To-Do', tags: ['Engineering', 'Web'], subtasks: [{ id: 's4', text: 'Gather new content', done: false }, { id: 's5', text: 'Update design mockups', done: false }], comments: [], createdAt: '2026-03-02T11:00:00' },
        { id: 'TSK003', title: 'Solar Panel Installation - Hyderabad Site', description: 'Coordinate the installation of 50kW solar panel system at the Hyderabad office complex.', assignedTo: 'EMP003', createdBy: 'EMP006', priority: 'High', dueDate: '2026-03-20', status: 'This Week', tags: ['Engineering', 'Installation'], subtasks: [{ id: 's6', text: 'Site survey', done: true }, { id: 's7', text: 'Permit approvals', done: true }, { id: 's8', text: 'Equipment procurement', done: false }, { id: 's9', text: 'Installation', done: false }], comments: [], createdAt: '2026-02-25T08:00:00' },
        { id: 'TSK004', title: 'Prepare Trade Exhibition Material', description: 'Design and print all materials needed for the upcoming renewable energy trade exhibition.', assignedTo: 'EMP005', createdBy: 'EMP001', priority: 'High', dueDate: '2026-03-12', status: 'In Progress', tags: ['Marketing', 'Event'], subtasks: [{ id: 's10', text: 'Finalize budget', done: true }, { id: 's11', text: 'Book booth', done: true }, { id: 's12', text: 'Design marketing materials', done: false }, { id: 's13', text: 'Promote on social media', done: false }], comments: [{ author: 'EMP005', text: 'Booth #42 confirmed!', date: '2026-03-04T14:00:00' }], createdAt: '2026-02-28T10:00:00' },
        { id: 'TSK005', title: 'Client Follow-up Calls', description: "Call all leads from last month who haven't responded to proposals.", assignedTo: 'EMP007', createdBy: 'EMP001', priority: 'Medium', dueDate: '2026-03-08', status: 'To-Do', tags: ['Sales', 'Follow-up'], subtasks: [], comments: [], createdAt: '2026-03-03T09:00:00' },
        { id: 'TSK006', title: 'Employee Onboarding - March Batch', description: 'Complete onboarding process for new employees joining in March.', assignedTo: 'EMP006', createdBy: 'EMP006', priority: 'Medium', dueDate: '2026-03-07', status: 'Done', tags: ['HR', 'Onboarding'], subtasks: [{ id: 's14', text: 'Prepare welcome kits', done: true }, { id: 's15', text: 'Setup accounts', done: true }, { id: 's16', text: 'Schedule orientation', done: true }], comments: [], createdAt: '2026-02-20T08:00:00' },
        { id: 'TSK007', title: 'Server Migration to AWS', description: 'Migrate on-premise servers to AWS cloud infrastructure.', assignedTo: 'EMP008', createdBy: 'EMP003', priority: 'Low', dueDate: '2026-03-25', status: 'This Week', tags: ['Engineering', 'DevOps'], subtasks: [{ id: 's17', text: 'Backup data', done: false }, { id: 's18', text: 'Setup AWS environment', done: false }], comments: [], createdAt: '2026-03-01T14:00:00' },
        { id: 'TSK008', title: 'Social Media Campaign - Green Energy', description: "Launch a social media campaign highlighting Clear Energy's green energy initiatives.", assignedTo: 'EMP005', createdBy: 'EMP001', priority: 'Low', dueDate: '2026-03-18', status: 'To-Do', tags: ['Marketing', 'Social'], subtasks: [], comments: [], createdAt: '2026-03-05T10:00:00' },
        { id: 'TSK009', title: 'Quarterly Performance Reviews', description: 'Conduct Q1 performance reviews for all team members.', assignedTo: 'EMP006', createdBy: 'EMP006', priority: 'Medium', dueDate: '2026-04-01', status: 'To-Do', tags: ['HR', 'Review'], subtasks: [], comments: [], createdAt: '2026-03-06T08:00:00' },
        { id: 'TSK010', title: 'Update CRM Pipeline Stages', description: 'Reconfigure CRM pipeline stages based on new sales process.', assignedTo: 'EMP002', createdBy: 'EMP001', priority: 'Low', dueDate: '2026-03-14', status: 'Done', tags: ['Sales', 'CRM'], subtasks: [], comments: [], createdAt: '2026-02-15T09:00:00' },
    ],

    leads: [
        { id: 'LD001', companyName: 'Tata Power Solutions', contactPerson: 'Ramesh Verma', phone: '+91 98765 00001', email: 'ramesh@tatapower.com', industry: 'Energy', location: 'Mumbai', leadSource: 'Referral', dealValue: 4500000, assignedTo: 'EMP002', status: 'Qualified', nextFollowUp: '2026-03-10', notes: 'Interested in 100kW rooftop solar installation. Decision expected by month end.', createdAt: '2026-02-15T10:00:00' },
        { id: 'LD002', companyName: 'Infosys Green Campus', contactPerson: 'Lakshmi Devi', phone: '+91 98765 00002', email: 'lakshmi@infosys.com', industry: 'IT', location: 'Bangalore', leadSource: 'Website', dealValue: 8500000, assignedTo: 'EMP007', status: 'Proposal Sent', nextFollowUp: '2026-03-08', notes: 'Proposal for solar carport system at their Bangalore campus.', createdAt: '2026-02-10T09:00:00' },
        { id: 'LD003', companyName: 'Apollo Hospitals', contactPerson: 'Dr. Suresh Patel', phone: '+91 98765 00003', email: 'suresh@apollohospitals.com', industry: 'Healthcare', location: 'Hyderabad', leadSource: 'Cold call', dealValue: 3200000, assignedTo: 'EMP002', status: 'Contacted', nextFollowUp: '2026-03-12', notes: 'Exploring solar for their new hospital building.', createdAt: '2026-02-20T11:00:00' },
        { id: 'LD004', companyName: 'ITC Limited', contactPerson: 'Naveen Gupta', phone: '+91 98765 00004', email: 'naveen@itc.com', industry: 'FMCG', location: 'Kolkata', leadSource: 'Advertisement', dealValue: 12000000, assignedTo: 'EMP001', status: 'Negotiation', nextFollowUp: '2026-03-09', notes: 'Large scale solar farm project. Negotiating pricing and terms.', createdAt: '2026-01-25T08:00:00' },
        { id: 'LD005', companyName: 'Marriott Hotels', contactPerson: 'Arun Mehta', phone: '+91 98765 00005', email: 'arun@marriott.com', industry: 'Hospitality', location: 'Delhi', leadSource: 'Referral', dealValue: 5600000, assignedTo: 'EMP007', status: 'New Lead', nextFollowUp: '2026-03-11', notes: 'Initial inquiry about solar heating solutions for their Delhi property.', createdAt: '2026-03-01T14:00:00' },
        { id: 'LD006', companyName: 'Wipro Technologies', contactPerson: 'Sanjay Rao', phone: '+91 98765 00006', email: 'sanjay@wipro.com', industry: 'IT', location: 'Pune', leadSource: 'Website', dealValue: 6800000, assignedTo: 'EMP002', status: 'Won', nextFollowUp: '', notes: 'Contract signed for 200kW solar system.', createdAt: '2026-01-10T10:00:00' },
        { id: 'LD007', companyName: 'DLF Group', contactPerson: 'Priti Malhotra', phone: '+91 98765 00007', email: 'priti@dlf.com', industry: 'Real Estate', location: 'Gurgaon', leadSource: 'Cold call', dealValue: 9000000, assignedTo: 'EMP001', status: 'Lost', nextFollowUp: '', notes: 'Went with a competitor offering lower prices.', createdAt: '2026-01-05T09:00:00' },
        { id: 'LD008', companyName: 'Reliance Industries', contactPerson: 'Vikash Sharma', phone: '+91 98765 00008', email: 'vikash@ril.com', industry: 'Energy', location: 'Jamnagar', leadSource: 'Referral', dealValue: 25000000, assignedTo: 'EMP001', status: 'New Lead', nextFollowUp: '2026-03-15', notes: 'Potentially the largest deal. Solar farm for their refinery complex.', createdAt: '2026-03-05T16:00:00' },
        { id: 'LD009', companyName: 'HDFC Bank', contactPerson: 'Kavita Nair', phone: '+91 98765 00009', email: 'kavita@hdfc.com', industry: 'Banking', location: 'Mumbai', leadSource: 'Website', dealValue: 2800000, assignedTo: 'EMP007', status: 'Contacted', nextFollowUp: '2026-03-13', notes: 'Solar for 5 branch offices.', createdAt: '2026-02-28T10:00:00' },
        { id: 'LD010', companyName: 'Amul Dairy', contactPerson: 'Deepak Patel', phone: '+91 98765 00010', email: 'deepak@amul.com', industry: 'Food', location: 'Anand', leadSource: 'Advertisement', dealValue: 4100000, assignedTo: 'EMP002', status: 'Qualified', nextFollowUp: '2026-03-14', notes: 'Solar for their processing plant.', createdAt: '2026-02-18T09:00:00' },
    ],

    leaves: [
        { id: 'LV001', employeeId: 'EMP002', leaveType: 'Casual Leave', startDate: '2026-03-10', endDate: '2026-03-11', totalDays: 2, reason: 'Family function', status: 'Approved', appliedOn: '2026-03-03T09:00:00' },
        { id: 'LV002', employeeId: 'EMP004', leaveType: 'Sick Leave', startDate: '2026-03-07', endDate: '2026-03-07', totalDays: 1, reason: 'Not feeling well', status: 'Approved', appliedOn: '2026-03-06T22:00:00' },
        { id: 'LV003', employeeId: 'EMP005', leaveType: 'Work From Home', startDate: '2026-03-08', endDate: '2026-03-08', totalDays: 1, reason: 'Internet technician visit', status: 'Pending', appliedOn: '2026-03-06T18:00:00' },
        { id: 'LV004', employeeId: 'EMP007', leaveType: 'Earned Leave', startDate: '2026-03-15', endDate: '2026-03-20', totalDays: 5, reason: 'Vacation', status: 'Pending', appliedOn: '2026-03-05T10:00:00' },
        { id: 'LV005', employeeId: 'EMP008', leaveType: 'Casual Leave', startDate: '2026-03-03', endDate: '2026-03-04', totalDays: 2, reason: 'Personal work', status: 'Approved', appliedOn: '2026-02-28T11:00:00' },
        { id: 'LV006', employeeId: 'EMP003', leaveType: 'Emergency Leave', startDate: '2026-02-25', endDate: '2026-02-26', totalDays: 2, reason: 'Family emergency', status: 'Approved', appliedOn: '2026-02-25T07:00:00' },
        { id: 'LV007', employeeId: 'EMP002', leaveType: 'Sick Leave', startDate: '2026-02-15', endDate: '2026-02-16', totalDays: 2, reason: 'Fever', status: 'Approved', appliedOn: '2026-02-14T21:00:00' },
        { id: 'LV008', employeeId: 'EMP006', leaveType: 'Work From Home', startDate: '2026-03-12', endDate: '2026-03-12', totalDays: 1, reason: 'Doctor appointment in the morning', status: 'Pending', appliedOn: '2026-03-07T08:00:00' },
    ],

    leaveBalances: [
        { empId: 'EMP001', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 2, sickUsed: 0, earnedUsed: 3, wfhUsed: 5, emergencyUsed: 0 },
        { empId: 'EMP002', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 4, sickUsed: 2, earnedUsed: 0, wfhUsed: 8, emergencyUsed: 0 },
        { empId: 'EMP003', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 1, sickUsed: 1, earnedUsed: 5, wfhUsed: 3, emergencyUsed: 2 },
        { empId: 'EMP004', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 3, sickUsed: 1, earnedUsed: 2, wfhUsed: 6, emergencyUsed: 0 },
        { empId: 'EMP005', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 2, sickUsed: 0, earnedUsed: 1, wfhUsed: 4, emergencyUsed: 0 },
        { empId: 'EMP006', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 0, sickUsed: 2, earnedUsed: 4, wfhUsed: 7, emergencyUsed: 1 },
        { empId: 'EMP007', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 1, sickUsed: 0, earnedUsed: 5, wfhUsed: 2, emergencyUsed: 0 },
        { empId: 'EMP008', casual: 12, sick: 10, earned: 15, wfh: 24, emergency: 3, casualUsed: 2, sickUsed: 3, earnedUsed: 0, wfhUsed: 1, emergencyUsed: 0 },
    ],

    activities: [
        { id: 'ACT001', type: 'task', action: 'Task completed', detail: 'Employee Onboarding - March Batch', user: 'EMP006', timestamp: '2026-03-07T16:30:00' },
        { id: 'ACT002', type: 'lead', action: 'Lead converted', detail: 'Wipro Technologies - ₹68L deal won', user: 'EMP002', timestamp: '2026-03-07T14:00:00' },
        { id: 'ACT003', type: 'leave', action: 'Leave approved', detail: 'Sneha Reddy - Sick Leave (1 day)', user: 'EMP003', timestamp: '2026-03-07T11:00:00' },
        { id: 'ACT004', type: 'task', action: 'Task updated', detail: 'Prepare Trade Exhibition Material - Booth confirmed', user: 'EMP005', timestamp: '2026-03-06T15:00:00' },
        { id: 'ACT005', type: 'lead', action: 'New lead created', detail: 'Reliance Industries - ₹2.5Cr potential', user: 'EMP001', timestamp: '2026-03-05T16:30:00' },
        { id: 'ACT006', type: 'task', action: 'Task assigned', detail: 'Client Follow-up Calls assigned to Karthik', user: 'EMP001', timestamp: '2026-03-05T09:00:00' },
        { id: 'ACT007', type: 'leave', action: 'Leave applied', detail: 'Karthik Nair - Earned Leave (5 days)', user: 'EMP007', timestamp: '2026-03-05T10:00:00' },
        { id: 'ACT008', type: 'lead', action: 'Follow-up done', detail: 'HDFC Bank - Scheduled site visit', user: 'EMP007', timestamp: '2026-03-04T11:00:00' },
        { id: 'ACT009', type: 'task', action: 'Subtask completed', detail: 'Solar Panel Installation - Site survey done', user: 'EMP003', timestamp: '2026-03-03T17:00:00' },
        { id: 'ACT010', type: 'login', action: 'User logged in', detail: 'Ananya Desai logged in from Chrome', user: 'EMP006', timestamp: '2026-03-07T08:00:00' },
    ],

    notifications: [
        { id: 'NT001', type: 'task', message: 'Task "Client Follow-up Calls" is due today', userId: 'EMP007', read: false, timestamp: '2026-03-07T08:00:00' },
        { id: 'NT002', type: 'lead', message: 'Follow-up reminder: Infosys Green Campus', userId: 'EMP007', read: false, timestamp: '2026-03-07T08:00:00' },
        { id: 'NT003', type: 'leave', message: 'Your leave request has been approved', userId: 'EMP004', read: false, timestamp: '2026-03-07T11:00:00' },
        { id: 'NT004', type: 'task', message: 'New task assigned: Prepare Q1 Sales Report', userId: 'EMP002', read: true, timestamp: '2026-03-01T09:00:00' },
        { id: 'NT005', type: 'lead', message: 'New lead assigned: Marriott Hotels', userId: 'EMP007', read: true, timestamp: '2026-03-01T14:00:00' },
        { id: 'NT006', type: 'leave', message: '2 pending leave requests need approval', userId: 'EMP001', read: false, timestamp: '2026-03-06T18:00:00' },
    ],
};
export async function runSeed(uri) {
    try {
        console.log('Clearing existing collections and seeding defaults...');
        await Promise.all([
            Employee.deleteMany({}),
            Task.deleteMany({}),
            Lead.deleteMany({}),
            Leave.deleteMany({}),
            LeaveBalance.deleteMany({}),
            Activity.deleteMany({}),
            Notification.deleteMany({})
        ]);

        await Employee.insertMany(seedData.employees);
        await Task.insertMany(seedData.tasks);
        await Lead.insertMany(seedData.leads);
        await Leave.insertMany(seedData.leaves);
        await LeaveBalance.insertMany(seedData.leaveBalances);
        await Activity.insertMany(seedData.activities);
        await Notification.insertMany(seedData.notifications);

        console.log('✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

// Support command-line execution too
if (import.meta.url === `file://${process.argv[1]}`) {
    mongoose.connect(MONGODB_URI).then(() => {
        runSeed().then(() => process.exit(0));
    });
}
