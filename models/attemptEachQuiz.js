const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const attemptEachQuizSchema = new Schema({
    quizId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Quiz', // อ้างอิงไปยัง Quiz
        required: true
    },
    attemptCount: {
        type: Number,
        required: true, // เก็บลำดับการทำในครั้งนี้
        default: 1
    },
    answers: {
        type: Map, // เก็บคำตอบที่ส่งมาในแต่ละครั้ง
        of: String,
        required: true
    },
    score: {
        type: Number, // คะแนนที่ได้
        default: 0
    },
    date: {
        type: Date,
        default: Date.now // วันที่เข้าทำ
    }
});

const attemptEachQuiz = mongoose.model('attemptEachQuiz', attemptSchema)

module.exports = attemptEachQuiz