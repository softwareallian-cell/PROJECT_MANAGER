const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');
const mongoose = require('mongoose');
const TimeSession = require('../models/TimeSession');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
});

router.post('/', async (req, res) => {
    try {
        const { projectId, subtaskIndex, subtaskTitle, userId, comment } = req.body;
        const session = new TimeSession({ projectId, subtaskIndex, subtaskTitle, userId, comment });
        const saved = await session.save();
        res.status(201).json(saved);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/pause', async (req, res) => {
    try {
        const { totalSeconds } = req.body;
        const session = await TimeSession.findByIdAndUpdate(req.params.id, { status: 'paused', totalSeconds }, { new: true });
        res.json(session);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/stop', async (req, res) => {
    try {
        const { totalSeconds } = req.body;
        const session = await TimeSession.findByIdAndUpdate(req.params.id, { status: 'stopped', totalSeconds }, { new: true });
        res.json(session);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/screenshot', upload.single('screenshot'), async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
        const session = await TimeSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const readable = Readable.from(req.file.buffer);
        const uploadStream = bucket.openUploadStream(`screenshot-${Date.now()}.png`, {
            metadata: { sessionId: req.params.id, mimetype: 'image/png' }
        });

        readable.pipe(uploadStream);
        uploadStream.on('finish', async () => {
            const gridfsId = String(uploadStream.id);
            session.screenshots.push({ capturedAt: new Date(), gridfsId });
            await session.save();
            res.json({ gridfsId });
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/project/:projectId', async (req, res) => {
    try {
        const sessions = await TimeSession.find({ projectId: req.params.projectId }).sort({ startedAt: -1 });
        res.json(sessions);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const sessions = await TimeSession.find({ userId: req.params.userId }).sort({ startedAt: -1 });
        res.json(sessions);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/screenshot/:fileId', async (req, res) => {
    try {
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
        const { ObjectId } = require('mongodb');
        const fileId = new ObjectId(req.params.fileId);

        const files = await bucket.find({ _id: fileId }).toArray();
        if (!files || files.length === 0) return res.status(404).json({ message: 'Screenshot not found' });

        res.set('Content-Type', 'image/png');
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.pipe(res);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
