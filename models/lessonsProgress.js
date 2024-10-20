// const { descriptors } = require('chart.js/dist/core/core.defaults');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lessonProgressSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessons',
        required: true
    },
    progress: {
        type: Number, // เก็บเป็นเปอร์เซ็นต์
        default: 0
    },
    completedLayouts: [{
        layoutId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        type: {
            type: String,
            enum: ['Layout1s', 'Layout2s', 'Layout3s', 'Layout4s', 'Layout5s', 'pdfFile', 'TextEditor'], // ระบุชนิดของ layout หรือ PDF
            required: true
        },
    }],
    timeSpentInSeconds: {
        type: Number,
        default: 0
    },
    subjectMongooseId: {
        type: mongoose.Schema.ObjectId,
        ref: 'subject'
    },
    finishedProgress: {
        checkFinished: {
            type: Boolean,
            default: false
        },
        message: {
            type: String
        },
        finishehDate: {
            type: Date
        }
    },
    // timestamps: {
    //     type: Date,
    //     default: Date.now
    // }
}, { timestamps: true });

const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema);

module.exports = LessonProgress;
