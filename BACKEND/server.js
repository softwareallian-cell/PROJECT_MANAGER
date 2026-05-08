const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- ROUTES ---
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const timeRoutes = require('./routes/timeRoutes');

app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timesessions', timeRoutes);

// Shared File/Screenshot Access
const { GridFSBucket, ObjectId } = require('mongodb');
let bucket;

mongoose.connection.once('open', () => {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    console.log("✅ GridFS Bucket Ready");
});

app.get('/api/attachments/:fileId', async (req, res) => {
    try {
        if (!bucket) return res.status(503).json({ message: 'GridFS not initialized' });
        const fileId = new ObjectId(req.params.fileId);
        const files = await bucket.find({ _id: fileId }).toArray();
        if (!files || files.length === 0) return res.status(404).json({ message: 'File not found' });
        res.set('Content-Type', files[0].metadata?.mimetype || 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${files[0].filename}"`);
        bucket.openDownloadStream(fileId).pipe(res);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/screenshots/:fileId', async (req, res) => {
    try {
        if (!bucket) return res.status(503).json({ message: 'GridFS not initialized' });
        const fileId = new ObjectId(req.params.fileId);
        res.set('Content-Type', 'image/png');
        bucket.openDownloadStream(fileId).pipe(res);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ DB Connected & Modular Server Ready");
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
    })
    .catch(err => console.error("❌ DB Error:", err));

// Graceful Shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log("🛑 MongoDB Connection Closed (SIGINT)");
        process.exit(0);
    } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    try {
        await mongoose.connection.close();
        console.log("🛑 MongoDB Connection Closed (SIGTERM)");
        process.exit(0);
    } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
    }
});