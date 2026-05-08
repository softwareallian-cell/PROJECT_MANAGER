const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    avatar: { type: String },
    lastSeen: { type: Date, default: Date.now },
    role: {
        type: String,
        enum: ['manager', 'member'],
        default: 'member'
    },
    notifications: [{
        message: { type: String },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);