const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const lessonQuestionchema = new Schema({
    Questions:[ {
        questionNo: {
            type: Number,
            required: true 
        },
        questionText: {
            type: String, 
            required: true
        }
    }],
    Lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessons'
    },
    maxScore: {
        type:Number
    }

}, { timestamps: true });

const lessonQuestion = mongoose.model('lessonQuestions', lessonQuestionchema)

module.exports = lessonQuestion