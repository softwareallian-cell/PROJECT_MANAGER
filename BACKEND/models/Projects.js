const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    Title: { type: String, required: true },
    Description: { type: String, default: '' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // Link to Team

    status: {
        type: String,
        enum: ['backlog', 'todo', 'inprogress', 'inreview', 'onhold', 'done', 'complete'],
        default: 'backlog'
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    tags: [{ type: String }],

    sprint: { type: Number, default: 1 },

    // Replaces old user_id — who created this project
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Who this project is assigned to (can be multiple users)
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    date: { type: String, required: true },
    startDate: { type: String, default: () => new Date().toISOString().substring(0, 10) },

    // Phase 2 fields — schema ready, UI comes later
    subtasks: [{
        title: { type: String },
        completed: { type: Boolean, default: false }
    }],

    checklist: [{
        item: { type: String },
        done: { type: Boolean, default: false }
    }],

    milestones: [{
        title: { type: String },
        dueDate: { type: String },
        completed: { type: Boolean, default: false }
    }],

    activityLog: [{
        action: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],

    timeLogs: [{
        startTime: { type: Date },
        endTime: { type: Date },
        duration: { type: Number } // in minutes
    }],

    attachments: [{
        filename: { type: String },
        path: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],

}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);