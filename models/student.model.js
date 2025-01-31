const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const studentSchema = new Schema(
    {
        studentId: {
            type: 'string',
            unique: true
        },
        yearLevel: {
            type: String,
            default: null
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        email: {
            type: String,
            required: true
        },
        fname: {
            type: String,
            required: true
        },
        lname: {
            type: String,
            required: true
        },
        notification: {
            type: mongoose.Schema.ObjectId,
            ref: 'Notification'
        },
        quizes: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Quiz'
        }],
        comments: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Comment'
        }],
        schoolYear: {
            type: mongoose.Schema.ObjectId,
            ref: 'schoolYear'
        },
        subjects: [
            {
                subjectMongooseId: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'subject'
                },
                subjectId: {
                    type: String,
                }, 
                subjectSemster: {
                    type: String,
                },
                weeks: [
                    {
                        week: {
                            type: String
                        },
                        scorePerWeek: {
                            type: Number,
                            default: 0
                        }
                    }
                ],
                quizAttempts: [{
                    quizId: {
                        type: mongoose.Schema.ObjectId,
                        ref: 'Quiz'
                    },
                    eachAttempt: [{
                        answers: [{
                            questionId: String, 
                            answer: mongoose.Schema.Types.Mixed,
                            isCorrect: Boolean,
                            points: Number
                        }],
                        score: Number,
                        attemptNumber: {
                            type: Number,
                            default: 1
                        },
                        submittedAt: {
                            type: Date,
                            default: Date.now
                        }
                    }]
                }]
            }
        ]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Add virtual for quiz attempts
studentSchema.virtual('myQuizAttempts', {
    ref: 'Quiz',
    localField: '_id', 
    foreignField: 'attempts.studentDbId',
    justOne: false
});

// Add method to get student's quiz attempts
studentSchema.methods.getMyQuizAttempts = async function() {
    const populatedStudent = await this.populate({
        path: 'myQuizAttempts',
        match: { 'attempts.studentDbId': this._id },
        populate: {
            path: 'subject.subjectMongooseId',
            select: 'subjectId subjectName'
        }
    });

    // Get all attempts for this student
    const attempts = [];
    if (populatedStudent.myQuizAttempts) {
        populatedStudent.myQuizAttempts.forEach(quiz => {
            const studentAttempts = quiz.attempts.filter(attempt => 
                attempt.studentDbId.toString() === this._id.toString()
            );
            
            if (studentAttempts.length > 0) {
                attempts.push({
                    quizId: quiz._id,
                    quizName: quiz.quizname,
                    subject: quiz.subject,
                    attempts: studentAttempts
                });
            }
        });
    }

    return attempts;
};
studentSchema.plugin(mongoosePaginate);

const Student = mongoose.model('Student', studentSchema)

module.exports = Student 