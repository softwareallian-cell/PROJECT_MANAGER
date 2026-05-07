const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Task = require('../models/Task');
const Project = require('../models/Projects');

// GET a single team
router.get('/:teamId', async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId).populate('members', 'email role');
        if (!team) return res.status(404).json({ message: "Team not found" });
        const obj = team.toObject();
        obj.members_data = obj.members;
        obj.members = obj.members.map(m => m._id);
        res.json(obj);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// CREATE a team
router.post('/', async (req, res) => {
    try {
        const team = new Team(req.body);
        const saved = await team.save();
        const populated = await Team.findById(saved._id).populate('members', 'email role');
        const obj = populated.toObject();
        obj.members_data = obj.members;
        obj.members = obj.members.map(m => m._id);
        res.status(201).json(obj);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// UPDATE a team
router.put('/:teamId', async (req, res) => {
    try {
        const updated = await Team.findByIdAndUpdate(req.params.teamId, req.body, { new: true }).populate('members', 'email role');
        if (!updated) return res.status(404).json({ message: "Team not found" });
        const obj = updated.toObject();
        obj.members_data = obj.members;
        obj.members = obj.members.map(m => m._id);
        res.json(obj);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE a team
router.delete('/:teamId', async (req, res) => {
    try {
        await Team.findByIdAndDelete(req.params.teamId);
        res.json({ message: "Team deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- MEMBER MANAGEMENT ---
router.post('/:teamId/members', async (req, res) => {
    try {
        const { userId } = req.body;
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });
        if (!team.members.includes(userId)) {
            team.members.push(userId);
            await team.save();
        }
        const populated = await Team.findById(req.params.teamId).populate('members', 'email role');
        const obj = populated.toObject();
        obj.members_data = obj.members;
        obj.members = obj.members.map(m => m._id);
        res.json(obj);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:teamId/members/:userId', async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ message: "Team not found" });
        team.members = team.members.filter(id => String(id) !== String(req.params.userId));
        await team.save();
        const populated = await Team.findById(req.params.teamId).populate('members', 'email role');
        const obj = populated.toObject();
        obj.members_data = obj.members;
        obj.members = obj.members.map(m => m._id);
        res.json(obj);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- NESTED ROUTES (for frontend compatibility) ---

// GET tasks for a team
router.get('/:teamId/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({ teamId: req.params.teamId })
            .populate('assignee', 'email role')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET projects for a team
router.get('/:teamId/projects', async (req, res) => {
    try {
        const projects = await Project.find({ teamId: req.params.teamId });
        res.json(projects);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
