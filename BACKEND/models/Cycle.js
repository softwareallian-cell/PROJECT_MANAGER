const mongoose = require('mongoose');

const CycleSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    
    number: { type: Number, required: true }, // e.g. Cycle 1, Cycle 2
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    
    isCompleted: { type: Boolean, default: false },

    // Summary stats for the cycle (can be updated on close)
    stats: {
        totalIssues: { type: Number, default: 0 },
        completedIssues: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
        completedPoints: { type: Number, default: 0 }
    }

}, { timestamps: true });

module.exports = mongoose.model('Cycle', CycleSchema);
