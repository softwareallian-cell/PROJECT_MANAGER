const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Projects');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// SIGNUP - create new user
router.post('/signup', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: "Email already exists" });
        const newUser = new User({ email, password, role });
        const saved = await newUser.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error("SIGNUP ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// LOGIN - find user by email+password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email not found" });
        if (user.password !== password) return res.status(401).json({ message: "Wrong password" });
        res.json(user);
    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// GOOGLE LOGIN
router.post('/google-login', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name, picture } = ticket.getPayload();

        let user = await User.findOne({ email });
        if (!user) {
            // Create new user if doesn't exist
            user = new User({
                email,
                name: name || email.split('@')[0],
                password: Math.random().toString(36).slice(-10), // Random password
                role: 'member'
            });
            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error("GOOGLE LOGIN ERROR:", err.message);
        res.status(500).json({ message: "Google authentication failed" });
    }
});

// UPDATE profile
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Project.deleteMany({ createdBy: req.params.id });
        res.json({ message: "User and their projects deleted" });
    } catch (err) {
        console.error("DELETE PROFILE ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '_id email role');
        res.json(users);
    } catch (err) {
        console.error("GET USERS ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

router.get('/search', async (req, res) => {
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
router.get('/:id/notifications', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, 'notifications');
        res.json(user.notifications);
    } catch (err) {
        console.error("GET NOTIFICATIONS ERROR:", err.message);
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/notifications/read', async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.params.id },
            { $set: { 'notifications.$[].read': true } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
