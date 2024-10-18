const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const lessonQuestionchema = new Schema({
    Questions:[ {
        questionNo: {
            type: String, 
        },
        questionText: {
            type: String, 
        }
    }],
    Lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessons'
    }

}, { timestamps: true });

const lessonQuestion = mongoose.model('lessonQuestions', lessonQuestionchema)

module.exports = lessonQuestion