const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subjectStatsSchema = new Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subject',
        required: true
    },
    subjectProgress: {
        type: Number, // จำนวนบทเรียนทั้งหมดในรายวิชา
        default: 0
    },
    lessonArray: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            required: true 
        }
    ],
    // timestamps: {
    //     type: Date,a
    //     default: Date.now
    // }
}, { timestamps: true });

const SubjectStats = mongoose.model('SubjectStats', subjectStatsSchema);

module.exports = SubjectStats;
