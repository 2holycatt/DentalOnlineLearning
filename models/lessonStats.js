const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lessonStatsSchema = new Schema({
    // subject: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'subject',
    //     required: true
    // },
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessons',
        required: true
    },
    totalLayouts: {
        type: Number, // จำนวนรวมของ Layout ทั้งหมดในบทเรียนนี้
        default: 0
    },
    totalPdfFiles: {
        type: Number, // จำนวนรวมของ PDF ทั้งหมดในบทเรียนนี้
        default: 0
    },
    layoutProportion: {
        type: Number, // สัดส่วน Layout (%) ต่อเนื้อหาทั้งหมดในบทเรียน
        default: 0
    },
    pdfProportion: {
        type: Number, // สัดส่วน PDF (%) ต่อเนื้อหาทั้งหมดในบทเรียน
        default: 0
    },
    layoutLists: [
        {
            layoutId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            type: {
                type: String,
                enum: ['Layout1s', 'Layout2s', 'Layout3s', 'Layout4s', 'Layout5s', 'pdfFile'], // ระบุชนิดของ layout หรือ PDF
                required: true
            }
        }
    ],
    subject: {
        type: mongoose.Schema.ObjectId,
        ref: 'subject'
    },

    // timestamps: {
    //     type: Date,
    //     default: Date.now
    // }
}, { timestamps: true });

const lessonStats = mongoose.model('lessonStats', lessonStatsSchema);

module.exports = lessonStats;
