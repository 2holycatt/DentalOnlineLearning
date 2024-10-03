const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const schoolYearSchema = new Schema(
{
    
    schoolYear:{ 
        type: Number,
    },
    students:[{
        type: mongoose.Schema.ObjectId,
        ref: 'student',
        default: 0
    }],
    quizes:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Quiz',
        default: 0
    }],
    lessonArray:[{
        type: mongoose.Schema.ObjectId,
        ref: 'lessons',
        default: 0
    }],
    Assignments:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Assignments',
        default: 0
    }]
}, {
    timestamps: true
})

const schoolYear = mongoose.model('schoolYear', schoolYearSchema)

module.exports = schoolYear