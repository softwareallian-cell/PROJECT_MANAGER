const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const Team = require('../models/Team');

router.get('/', async (req, res) => {
    try {
        const workspaces = await Workspace.find();
        res.json(workspaces);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const workspace = new Workspace(req.body);
        const saved = await workspace.save();
        res.status(201).json(saved);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET teams for a workspace
router.get('/:workspaceId/teams', async (req, res) => {
    try {
        const teams = await Team.find({ workspaceId: req.params.workspaceId }).populate('members', 'email role');
        const transformedTeams = teams.map(t => {
            const obj = t.toObject();
            obj.members_data = obj.members;
            obj.members = obj.members.map(m => m._id);
            return obj;
        });
        res.json(transformedTeams);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
