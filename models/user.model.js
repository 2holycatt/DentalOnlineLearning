const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    googleId: String,
    email: {
        type: String,
        unique: true,
        required: [true, 'Please provide email']
    },
    name: {
        type: String,
    },
    nickname: {
        type: String,
        default: null,
    },
    major: {
        type: String,
    },
    img: {
        type: String,
        default: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png'
    },
    note: {
        type: String,
        default: null
    },
    role: {
        type: String,
    },
    teacher: {
        type: mongoose.Schema.ObjectId,
        ref: 'teacher'
    },
    student: {
        type: mongoose.Schema.ObjectId,
        ref: 'Student'
    },
    deleted_at: {
        type: Date,
        default: null,
    },
    submitAssign: [{
        type: mongoose.Schema.ObjectId,
        ref: 'submitAssign'
    }],
    permission: {
        type: Boolean,
        default: true
    },
    studentFromKku: {
        type: Boolean,
        default: false
    }
}, 
{ timestamps: true })

const User = mongoose.model('User', userSchema);

module.exports = User;