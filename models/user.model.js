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
    fname: {
        type: String,
        default: "default",
    },
    lname: {
        type: String,
        default: "default",
    },
    // name: {
    //     type: String,
    // },
    nickname: {
        type: String,
        default: null,
    },
    major: {
        type: String,
    },
    img: {
        type: String,
        default: 'https://ui-avatars.com/api/?background=random&color=fff&name=User&size=200&font-size=0.5'
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
    },
    attempts: [{
        type: mongoose.Schema.ObjectId,
        ref: 'attemptEachQuiz' 
    }],
}, 
{ timestamps: true })

const User = mongoose.model('User', userSchema);

module.exports = User;