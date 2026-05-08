const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // e.g. "software-alliance"
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
        logo: { type: String },
        primaryColor: { type: String, default: '#F2AA4D' }
    },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        status: { type: String, enum: ['active', 'invited'], default: 'active' },
        joinedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Workspace', WorkspaceSchema);
