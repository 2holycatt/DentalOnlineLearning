const mongoose = require('mongoose');

const optionSchema = mongoose.Schema({
    optionText: {
        type: String,
        required: true,
        trim: true
    }
});

const questionSchema = mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    questionType: {
        type: String,
        enum: ['MCQ', 'checkbox', 'Paragraph', 'short_answ'],
        required: true
    },
    options: {
        type: [optionSchema],
        validate: {
            validator: function (v) {
                if (this.questionType === 'MCQ' || this.questionType === 'checkbox') {
                    return v.length > 0;
                }
                return true;
            },
            message: 'Options are required for MCQ and checkbox question types.'
        }
    },
    answer: {
        type: Boolean,
        default: false
    },
    answerKey: {
        type: String,
        default: "",
        trim: true
    },
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    open: {
        type: Boolean,
        default: true
    }
});

// เพิ่ม schema สำหรับเก็บข้อมูลจำนวนครั้งที่เข้าทำแบบทดสอบของนักเรียน
const attemptSchema = mongoose.Schema({
    attemptCount: {
        type: Number,
        default: 0,
        min: 0
    },
    score: {
        type: Number,
        default: 0, // คะแนนที่ทำได้ในการพยายามนี้
        min: 0
    },
    date: {
        type: Date,
        default: Date.now // วันที่และเวลาที่ทำแบบทดสอบ
    }
});

const quizSchema = mongoose.Schema({
    quizname: {
        type: String,
        required: true,
        trim: true
    },
    quizdescription: {
        type: String,
        trim: true
    },
    upload: {
        type: Boolean,
        default: false
    },
    owner: {
        type: String,
        trim: true
    },
    owneremail: {
        type: String,
        trim: true
    },
    quizImage: {
        data: {
            type: Buffer,
            default: null
        },
        contentType: {
            type: String,
            default: null
        }
    },
    questions: {
        type: [questionSchema],
        default: []
    },
    schoolYear: {
        type: mongoose.Schema.ObjectId,
        ref: 'schoolYear',
        default: null
    },
    timeLimit: {
        value: {
            type: Number,
            required: true,
        },
        display: {
            type: String,
            required: true,
            trim: true
        }
    },
    attemptLimit: {
        type: Number,
        default: 1,
        min: 1
    },
    attempts: {
        type: [attemptSchema],
        default: []
    },
    releaseWhen: {
        type: Date,
        default: null 
    },
    deadline: {
        type: Date,
        default: null
    },
    isReleased: {
        type: Boolean,
        default: false
    }
}
, 
{ timestamps: true });


module.exports = mongoose.model('Quiz', quizSchema);
