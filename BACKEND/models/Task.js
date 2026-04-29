const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    cycleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cycle' },
    
    title: { type: String, required: true },
    description: { type: String, default: '' },
    
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
        type: String,
        enum: ['backlog', 'todo', 'inprogress', 'inreview', 'onhold', 'done'],
        default: 'todo'
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    type: {
        type: String,
        enum: ['feature', 'bug', 'chore', 'research'],
        default: 'feature'
    },

    estimate: { type: Number, default: 0 }, // in hours or points

    subtasks: [{
        title: { type: String },
        completed: { type: Boolean, default: false }
    }],

    attachments: [{
        filename: { type: String },
        path: { type: String }, // GridFS ID
        uploadedAt: { type: Date, default: Date.now }
    }],

    tags: [{ type: String }]

}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
