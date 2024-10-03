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
        default: 'https://secure.gravatar.com/avatar/0d36b4ae4b9c67a2b162710923f792ed?s=35&amp;d=identicon'
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