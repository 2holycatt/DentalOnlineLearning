const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const studentAnswerEndChapterQuestionsSchema = new Schema({
    Questions:[ {
        questionNo: {
            type: String, 
        },
        questionText: {
            type: String, 
        }
    }],
    lessonQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessonQuestions'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    checked: {
        type: Boolean,
        default: false
    },
    Score: {
        type: Number,
        default: 0
    },
    note: {
        type: String,
    }

}, { timestamps: true });

const studentAnswerEndChapterQuestions = mongoose.model('studentAnswerEndChapterQuestions', studentAnswerEndChapterQuestionsSchema)

module.exports = studentAnswerEndChapterQuestions