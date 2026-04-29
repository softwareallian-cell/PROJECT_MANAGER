const mongoose = require('mongoose');

const TimeSessionSchema = new mongoose.Schema({
    projectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    subtaskIndex: { type: Number, required: true },
    subtaskTitle: { type: String, required: true },
    userId:       { type: mongoose.Schema.Types.ObjectId, required: true },
    comment:      { type: String, default: '' },
    startedAt:    { type: Date,   default: Date.now },
    totalSeconds: { type: Number, default: 0 },
    status:       { type: String, enum: ['active', 'paused', 'stopped'], default: 'active' },
    screenshots:  [
        {
            capturedAt: { type: Date,   default: Date.now },
            gridfsId:   { type: String, required: true }
        }
    ]
});

module.exports = mongoose.model('TimeSession', TimeSessionSchema);
