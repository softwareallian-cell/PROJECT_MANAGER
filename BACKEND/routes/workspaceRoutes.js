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

// GET all members of a workspace
router.get('/:workspaceId/members', async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.workspaceId)
            .populate('members.user', 'email name avatar lastSeen');
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
        
        // Also find teams for each member
        const teams = await Team.find({ workspaceId: req.params.workspaceId });
        
        const membersWithTeams = workspace.members.map(m => {
            const memberObj = m.toObject();
            memberObj.teams = teams.filter(t => t.members.includes(m.user._id))
                                   .map(t => ({ _id: t._id, name: t.name, color: t.color }));
            return memberObj;
        });
        
        res.json(membersWithTeams);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// INVITE members to workspace
router.post('/:workspaceId/invite', async (req, res) => {
    try {
        const { emails, teamIds } = req.body; // emails is an array
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const User = require('../models/User');
        const results = [];

        for (const email of emails) {
            let user = await User.findOne({ email });
            if (!user) {
                // Create placeholder user for invitation
                user = new User({ email, password: 'invited_placeholder', name: email.split('@')[0] });
                await user.save();
            }

            // Check if already a member
            const isMember = workspace.members.find(m => String(m.user) === String(user._id));
            if (!isMember) {
                workspace.members.push({ user: user._id, status: 'invited', role: 'member' });
                results.push({ email, status: 'invited' });
            } else {
                results.push({ email, status: 'already_member' });
            }

            // Add to teams if provided
            if (teamIds && teamIds.length > 0) {
                for (const teamId of teamIds) {
                    const team = await Team.findById(teamId);
                    if (team && !team.members.includes(user._id)) {
                        team.members.push(user._id);
                        await team.save();
                    }
                }
            }
        }

        await workspace.save();
        res.json({ message: 'Invites processed', results });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// UPDATE member role
router.put('/:workspaceId/members/:userId/role', async (req, res) => {
    try {
        const { role } = req.body;
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const member = workspace.members.find(m => String(m.user) === String(req.params.userId));
        if (!member) return res.status(404).json({ message: 'Member not found' });

        member.role = role;
        await workspace.save();
        res.json(workspace.members);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// REMOVE member from workspace
router.delete('/:workspaceId/members/:userId', async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        workspace.members = workspace.members.filter(m => String(m.user) !== String(req.params.userId));
        await workspace.save();

        // Also remove from all teams in this workspace
        await Team.updateMany(
            { workspaceId: req.params.workspaceId },
            { $pull: { members: req.params.userId } }
        );

        res.json({ message: 'Member removed' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
