const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // e.g. "software-alliance"
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
        logo: { type: String },
        primaryColor: { type: String, default: '#F2AA4D' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Workspace', WorkspaceSchema);
