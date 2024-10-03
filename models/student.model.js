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
                        },
                        noteWeek: {
                            type: String,
                            default: null
                        }
                    }
                ],
                studentNumber: {
                    type: String
                }
            }
        ]
    }, 
    {
    timestamps: true
    }
)
studentSchema.plugin(mongoosePaginate);

const Student = mongoose.model('Student', studentSchema)

module.exports = Student 