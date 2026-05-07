const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');
const mongoose = require('mongoose');
const Project = require('../models/Projects');
const User = require('../models/User');
const TimeSession = require('../models/TimeSession');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
});

router.get('/created/:userId', async (req, res) => {
    try {
        const projects = await Project.find({ createdBy: req.params.userId });
        res.json(projects);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/assigned/:userId', async (req, res) => {
    try {
        const projects = await Project.find({ assignedTo: req.params.userId });
        res.json(projects);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const newProject = new Project({ ...req.body, activityLog: [{ action: `Project created`, timestamp: new Date() }] });
        const saved = await newProject.save();
        res.status(201).json(saved);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        const logEntry = { action: `Project updated`, timestamp: new Date() };
        if (req.body.status && req.body.status !== project.status) {
            logEntry.action = `Status changed from "${project.status}" to "${req.body.status}"`;
            if (project.assignedTo.length > 0) {
                await User.updateOne({ _id: project.createdBy }, { $push: { notifications: { message: `Status of "${project.Title}" changed to "${req.body.status}"`, projectId: project._id, read: false, createdAt: new Date() } } });
            }
        }
        const setFields = {};
        const allowedFields = ['Title', 'Description', 'status', 'priority', 'tags', 'sprint', 'date', 'subtasks', 'checklist', 'milestones'];
        allowedFields.forEach(field => { if (req.body[field] !== undefined) setFields[field] = req.body[field]; });
        const updated = await Project.findByIdAndUpdate(req.params.id, { $set: setFields, $push: { activityLog: logEntry } }, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try { await Project.findByIdAndDelete(req.params.id); res.json({ message: "Project deleted" }); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/assign', async (req, res) => {
    try {
        const { assignToUserId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        if (!project.assignedTo.includes(assignToUserId)) {
            project.assignedTo.push(assignToUserId);
            project.activityLog.push({ action: `Project assigned to user ${assignToUserId}`, timestamp: new Date() });
            await project.save();
        }
        await User.updateOne({ _id: assignToUserId }, { $push: { notifications: { message: `You have been assigned to project "${project.Title}"`, projectId: project._id, read: false, createdAt: new Date() } } });
        res.json(project);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/assign/:userId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });
        project.assignedTo = project.assignedTo.filter(uid => String(uid) !== String(req.params.userId));
        project.activityLog.push({ action: `User removed from project`, timestamp: new Date() });
        await project.save();
        res.json(project);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET time sessions for a project
router.get('/:projectId/timesessions', async (req, res) => {
    try {
        const sessions = await TimeSession.find({ projectId: req.params.projectId }).sort({ startedAt: -1 });
        res.json(sessions);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ATTACHMENTS ---
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
        if (!req.file) return res.status(400).json({ message: 'No file provided' });
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        const readable = Readable.from(req.file.buffer);
        const uploadStream = bucket.openUploadStream(req.file.originalname, { metadata: { projectId: req.params.id, mimetype: req.file.mimetype } });
        readable.pipe(uploadStream);
        uploadStream.on('finish', async () => {
            project.attachments.push({ filename: req.file.originalname, path: String(uploadStream.id), uploadedAt: new Date() });
            project.activityLog.push({ action: `File uploaded: "${req.file.originalname}"`, timestamp: new Date() });
            await project.save();
            res.json(project);
        });
        uploadStream.on('error', (err) => res.status(500).json({ message: err.message }));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/attachments/:fileId', async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
        const { ObjectId } = require('mongodb');
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        try { await bucket.delete(new ObjectId(req.params.fileId)); } catch (e) { console.warn('GridFS delete warning:', e.message); }
        const removedFile = project.attachments.find(a => a.path === req.params.fileId);
        project.attachments = project.attachments.filter(a => a.path !== req.params.fileId);
        project.activityLog.push({ action: `File deleted: "${removedFile?.filename || req.params.fileId}"`, timestamp: new Date() });
        await project.save();
        res.json(project);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
