const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    optionText: {
        type: String,
        required: true,
        trim: true
    }
});

const matchingOptionSchema = new mongoose.Schema({
    left: {
        text: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            url: String,
            contentType: String
        },
        index: {
            type: Number,
            required: true
        }
    },
    right: {
        text: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            url: String,
            contentType: String
        },
        index: {
            type: Number,
            required: true
        }
    },
    points: {
        type: Number,
        default: 1,
        min: 0
    },
    correctMatch: {
        leftIndex: {
            type: Number,
            required: true
        },
        rightIndex: {
            type: Number,
            required: true
        }
    }
});

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    questionImage: {
        url: {
            type: String,
            default: null
        },
        contentType: {
            type: String,
            default: null
        }
    },
    questionType: {
        type: String,
        enum: ['MCQ', 'checkbox', 'Paragraph', 'short_answ','matching'],
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
    matchingPairs: {
        type: [matchingOptionSchema],
        validate: {
            validator: function(v) {
                if (this.questionType !== 'matching') return true;
                
                // ตรวจสอบว่ามีคู่คำถามอย่างน้อย 1 คู่
                if (!v || v.length === 0) return false;
                
                // ตรวจสอบว่า index ไม่ซ้ำกัน
                const leftIndexes = v.map(pair => pair.left.index);
                const rightIndexes = v.map(pair => pair.right.index);
                
                const uniqueLeftIndexes = new Set(leftIndexes);
                const uniqueRightIndexes = new Set(rightIndexes);
                
                return uniqueLeftIndexes.size === leftIndexes.length &&
                       uniqueRightIndexes.size === rightIndexes.length;
            },
            message: 'Matching questions require valid pairs with unique indexes'
        }
    },

    answer: {
        type: mongoose.Schema.Types.Mixed,
        validate: {
            validator: function(v) {
                if (this.questionType === 'matching') {
                    return Array.isArray(v) && v.every(match => 
                        typeof match.leftIndex === 'number' && 
                        typeof match.rightIndex === 'number'
                    );
                }
                return true;
            },
            message: 'Matching answers must be an array of valid matches'
        }
    },
    answerTexts: {
        type: [String],
        default: undefined
    },
    answerKey: {
        type: String,
        default: "",
        trim: true
    },
    points: {
        type: Number,
        default: 1,
        min: 0
    },
    open: {
        type: Boolean,
        default: true
    }
    
});

// เพิ่ม schema สำหรับเก็บข้อมูลจำนวนครั้งที่เข้าทำแบบทดสอบของนักเรียน
const attemptSchema = new mongoose.Schema({
    studentDbId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    studentId: {
        type: 'string',
        ref: 'Student',
    },
    studentName: {
        type: String,
        required: true
    },
        eachAttempt:[{
            answers: [{
                questionId: String,
                answer: mongoose.Schema.Types.Mixed,
                isCorrect: Boolean,
                points: Number,
                matchingAnswers: [{
                    leftIndex: Number,
                    rightIndex: Number,
                    isCorrect: Boolean,
                    pointsEarned: Number
                }]
            }],
            totalScore: {
                type: Number,
                default: 0
            },
            maxPossibleScore: {
                type: Number,
                default: 0
            },
            attemptNumber: {
                type: Number,
                default: 1
            },
            startedAt: {
                type: Date,
                default: Date.now
            },
            submittedAt: {
                type: Date
            },
            duration: {
                type: Number  
            }
    }]
  });

const quizSchema = new mongoose.Schema({
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
     subject: {
            subjectMongooseId: {
                type: mongoose.Schema.ObjectId,
                ref: 'subject'
            }
            ,
            subjectId: {
                type: String
            }
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
