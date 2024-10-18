const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    comment: {
        type: String,
    },
    files: [{
        contentType: {
            type: String,
        },
        file: {
            type: String,
        }
    }],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    replies: [
        {
            content: String,
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    Lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessons'
    },
    createdAtFormatted: {
        type: String
    },
    timeSince: {
        type: String
    }


}, { timestamps: true });

const Comment = mongoose.model('Comments', CommentSchema)

module.exports = Comment