const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true }, // e.g., "CREATE_TASK", "UPDATE_STATUS"
    resourceType: { type: String, required: true }, // e.g., "Project", "Task"
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: {
        field: { type: String },
        oldValue: { type: mongoose.Schema.Types.Mixed },
        newValue: { type: mongoose.Schema.Types.Mixed },
        message: { type: String }
    },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
