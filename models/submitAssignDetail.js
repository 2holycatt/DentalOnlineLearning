const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const submitAssignSchema = new Schema({
    comment: {
        type: String,
    },
    teacherComment: { 
        type: String,
        dafault: "ไม่มีการแสดงความคิดเห็น"
    },
    sendStatus: {
        status: {
            type: String,
        },
        day: {
            type: Number
        },
        hour: {
            type: Number
        },
        minute: {
            type: Number
        }
    },
    Score: {
        type: Number,
        default: 0
    },
    checked: {
        type: Boolean,
        default: false
    },
    checkDate : {
        type: Date
    },
    files: [{
        contentType: {
            type: String,
        },
        file: {
            type: String,
        }
        ,
    }],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    assignment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Assignments',
    }

}, { timestamps: true });

const submitAssign = mongoose.model('submitAssign', submitAssignSchema)

module.exports = submitAssign