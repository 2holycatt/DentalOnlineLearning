const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const teacherSchema = new Schema(
{
    tel:{ 
        type: String,
        default: "0945172149"
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    notification:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Notification'
    }],
    quiz:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Quiz'
    }],
    lessonArray:[{
        type: mongoose.Schema.ObjectId,
        ref: 'lessons'
    }],
    comments:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Comment'
    }],
}, {
    timestamps: true
}
)

const Teacher = mongoose.model('Teacher', teacherSchema)

module.exports = Teacher