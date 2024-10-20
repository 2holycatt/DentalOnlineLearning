const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const TextEditorSchema = new Schema({
    name:{
        type: 'string',
        default: 'TextEditor'
    },
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    LessonArrayObject:[
        {
            LessonId: {
                type:mongoose.Schema.Types.ObjectId,
                ref: 'lessons'
            }
        }
    ],
}, { timestamps: true });

const TextEditor = mongoose.model('TextEditor', TextEditorSchema)

module.exports = TextEditor