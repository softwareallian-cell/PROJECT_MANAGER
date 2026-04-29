const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true },
    key: { type: String, required: true }, // e.g. "ENG", "PROD"
    
    description: { type: String },

    // Custom workflow for this team
    workflow: [{
        name: { type: String, required: true },
        category: { type: String, enum: ['backlog', 'todo', 'inprogress', 'done', 'canceled'], default: 'todo' },
        color: { type: String }
    }],

    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    settings: {
        autoAssignCycles: { type: Boolean, default: true }
    }

}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);
