const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const pdfFileSchema = new Schema({
    name:{
        type: 'string',
        default: 'pdfFiles'
    },
    contentType: {
        type: String,
    },
    file: {
        type: String,
    },
    LessonArrayObject:[
        {
            LessonId: {
                type:mongoose.Schema.Types.ObjectId,
                ref: 'lessons'
            }
        }
    ]
}, { timestamps: true });

const pdfFile = mongoose.model('pdfFile', pdfFileSchema)

module.exports = pdfFile