const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const multer =require('multer');
const {GridFSBucket}=require('mongodb');
const {Readable}=require('stream');

const app = express();
app.use(express.json());
app.use(cors());

// multer — store file in memory buffer before streaming to GridFS
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB max
});


// DELETE the cached model before re-registering
mongoose.deleteModel(/.*Project.*/);
const Project = require('./models/Projects.js');
const User = require('./models/User.js');
let gridfsBucket;
// Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {console.log("✅ DB Connected");
gridfsBucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
        console.log("✅ GridFS Bucket Ready");})
    .catch(err => console.error("❌ DB Error:", err));

// --- USER ROUTES ---

// SIGNUP - create new user
app.post('/api/users/signup', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already exists" });
        const newUser = new User({ email, password, role });
        const saved = await newUser.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("SIGNUP ERROR:", err.message);  // ADD THIS
        res.status(500).json({ message: err.message });
    }
});

// LOGIN - find user by email+password
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email not found" });
        if (user.password !== password) return res.status(401).json({ message: "Wrong password" });
        res.json(user);
    } catch (err) {
        console.error("LOGIN ERROR:", err.message);   // ADD THIS
        res.status(500).json({ message: err.message });
    }
});

// UPDATE profile
app.put('/api/users/:id', async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after' }
        );
        res.json(updated);
    } catch (err) { res.status(500).json(err); }
});

// DELETE profile
app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Project.deleteMany({ createdBy: req.params.id });
        res.json({ message: "User and their projects deleted" });
    } catch (err) {
        console.error("DELETE PROFILE ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '_id email role');
        res.json(users);
    } catch (err) {
        console.error("GET USERS ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/users/search', async (req, res) => {
    try {
        const { q } = req.query;
        const users = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        }).select('_id name email role');
        res.json(users);
    } catch (err) {
        console.error("SEARCH USER ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});



// GET NOTIFICATIONS for a user
app.get('/api/users/:id/notifications', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, 'notifications');
        res.json(user.notifications);
    } catch (err) {
        console.error("GET NOTIFICATIONS ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/users/:id/notifications/read', async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.params.id },
            { $set: { 'notifications.$[].read': true } }  // $[] = all array elements
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- PROJECT ROUTES ---

// 1. GET all projects for a specific user
app.get('/api/projects/created/:userId', async (req, res) => {
    try {
        const projects = await Project.find({ createdBy: req.params.userId });
        res.json(projects);
    } catch (err) {
        console.error("GET PROJECt ERROR:", err.message);   // ADD THIS
        res.status(500).json({ message: err.message });
    }
});


// Get projects assigned to user
app.get('/api/projects/assigned/:userId', async (req, res) => {
    try {
        const projects = await Project.find({ assignedTo: req.params.userId });
        res.json(projects);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. ADD a new project
app.post('/api/projects', async (req, res) => {
    try {
        console.log("ADD PROJECT BODY:", req.body);
        const newProject = new Project({
            ...req.body,
            activityLog: [{ action: `Project created`, timestamp: new Date() }]
        });
        const saved = await newProject.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("ADD PROJECT ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// EDIT a project — FIX: $set now includes subtasks, checklist, milestones
app.put('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const logEntry = { action: `Project updated`, timestamp: new Date() };

        // If status changed, log it and notify creator
        if (req.body.status && req.body.status !== project.status) {
            logEntry.action = `Status changed from "${project.status}" to "${req.body.status}"`;

            if (project.assignedTo.length > 0) {
                await User.updateOne(
                    { _id: project.createdBy },
                    {
                        $push: {
                            notifications: {
                                message: `Status of "${project.Title}" changed to "${req.body.status}"`,
                                projectId: project._id,
                                read: false,
                                createdAt: new Date()
                            }
                        }
                    }
                );
            }
        }

        // Build $set dynamically — only include fields that were sent
        const setFields = {};
        const allowedFields = [
            'Title', 'Description', 'status', 'priority',
            'tags', 'sprint', 'date',
            'subtasks', 'checklist', 'milestones'  // FIX: added these 3
        ];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                setFields[field] = req.body[field];
            }
        });
        console.log("SET FIELDS:", JSON.stringify(setFields));
        const updated = await Project.findByIdAndUpdate(
            req.params.id,
            {
                $set: setFields,
                $push: { activityLog: logEntry }
            },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        console.error("EDIT PROJECT ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});
// DELETE a project
app.delete('/api/projects/:id', async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: "Project deleted" });
    } catch (err) {
        console.error("DELETE PROJECT ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ASSIGN a project to a user
app.put('/api/projects/:id/assign', async (req, res) => {
    try {
        const { assignToUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (!project.assignedTo.includes(assignToUserId)) {
            project.assignedTo.push(assignToUserId);
            project.activityLog.push({
                action: `Project assigned to user ${assignToUserId}`,
                timestamp: new Date()
            });
            await project.save();
        }

        // Notify the assigned user
        await User.updateOne(
            { _id: assignToUserId },
            {
                $push: {
                    notifications: {
                        message: `You have been assigned to project "${project.Title}"`,
                        projectId: project._id,
                        read: false,
                        createdAt: new Date()
                    }
                }
            }
        );

        res.json(project);
    } catch (err) {
        console.error("ASSIGN PROJECT ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});


// REMOVE an assignee from a project
app.delete('/api/projects/:id/assign/:userId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        project.assignedTo = project.assignedTo.filter(
            uid => String(uid) !== String(req.params.userId)
        );
        project.activityLog.push({
            action: `User removed from project`,
            timestamp: new Date()
        });
        await project.save();

        res.json(project);
    } catch (err) {
        console.error("REMOVE ASSIGNEE ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// =============================================
// FILE ATTACHMENT ROUTES (GridFS)
// =============================================
 
// UPLOAD a file to a project
app.post('/api/projects/:id/attachments', upload.single('file'), async (req, res) => {
    try {
    if (!gridfsBucket) return res.status(503).json({ message: 'Storage not ready' });
        if (!req.file) return res.status(400).json({ message: 'No file provided' });
 
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
 
        // Stream the buffer into GridFS
        const readable = Readable.from(req.file.buffer);
        const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
            metadata: { projectId: req.params.id, mimetype: req.file.mimetype }
        });
 
        readable.pipe(uploadStream);
 
        uploadStream.on('finish', async () => {
            // Save reference in project.attachments
            project.attachments.push({
                filename: req.file.originalname,
                path: String(uploadStream.id),   // GridFS file id stored as path
                uploadedAt: new Date()
            });
            project.activityLog.push({
                action: `File uploaded: "${req.file.originalname}"`,
                timestamp: new Date()
            });
            await project.save();
            res.json(project);
        });
 
        uploadStream.on('error', (err) => {
            console.error('GRIDFS UPLOAD ERROR:', err.message);
            res.status(500).json({ message: err.message });
        });
 
    } catch (err) {
        console.error('UPLOAD ATTACHMENT ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
});
 
// DOWNLOAD a file by GridFS id
app.get('/api/attachments/:fileId', async (req, res) => {
    try {
        const { ObjectId } = require('mongodb');
        const fileId = new ObjectId(req.params.fileId);
 
        // Find file metadata to get original filename + mimetype
        const files = await gridfsBucket.find({ _id: fileId }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }
 
        const file = files[0];
        res.set('Content-Type', file.metadata?.mimetype || 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
 
        const downloadStream = gridfsBucket.openDownloadStream(fileId);
        downloadStream.pipe(res);
 
        downloadStream.on('error', () => {
            res.status(404).json({ message: 'File not found' });
        });
 
    } catch (err) {
        console.error('DOWNLOAD ATTACHMENT ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
});
 
// DELETE a file from a project
app.delete('/api/projects/:id/attachments/:fileId', async (req, res) => {
    try {
        const { ObjectId } = require('mongodb');
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
 
        // Remove from GridFS
        try {
            await gridfsBucket.delete(new ObjectId(req.params.fileId));
        } catch (e) {
            console.warn('GridFS delete warning (file may already be gone):', e.message);
        }
 
        // Remove from project.attachments
        const removedFile = project.attachments.find(a => a.path === req.params.fileId);
        project.attachments = project.attachments.filter(a => a.path !== req.params.fileId);
        project.activityLog.push({
            action: `File deleted: "${removedFile?.filename || req.params.fileId}"`,
            timestamp: new Date()
        });
        await project.save();
        res.json(project);
 
    } catch (err) {
        console.error('DELETE ATTACHMENT ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
});
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));