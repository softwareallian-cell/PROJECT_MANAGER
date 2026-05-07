const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Projects');

router.get('/team/:teamId', async (req, res) => {
    try {
        const tasks = await Task.find({ teamId: req.params.teamId })
            .populate('assignee', 'email role')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const task = new Task(req.body);
        const saved = await task.save();
        res.status(201).json(saved);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: "Task deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/team/:teamId/projects', async (req, res) => {
    try {
        const projects = await Project.find({ teamId: req.params.teamId });
        res.json(projects);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
