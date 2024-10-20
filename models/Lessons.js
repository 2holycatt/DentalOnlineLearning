const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const LessonTriggers = require('../triggers/lessonDatabaseTrigger');
const mongoosePaginate = require('mongoose-paginate-v2');
const lessonSchema = new Schema({
    LessonName: {
        type: String,
    },
    file: {
        type: String,
    },
    LayOut1ArrayObject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Layout1s',
        default: []
    }],
    LayOut2ArrayObject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Layout2s',
        default: []

    }],
    LayOut3ArrayObject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Layout3s',
        default: []

    }],
    LayOut4ArrayObject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Layout4s',
        default: []

    }],
    LayOut5ArrayObject: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Layout5s',
        default: []

    }],
    PdfFiles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'pdfFile',
        default: []
    }],
    TextEditors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TextEditor',
        default: []
    }],
    schoolYear: {
        type: mongoose.Schema.ObjectId,
        ref: 'schoolYear'
    },
    comments: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Comments',
    }],
    subject: {
        subjectMongooseId: {
            type: mongoose.Schema.ObjectId,
            ref: 'subject'
        }
        ,
        subjectId: {
            type: String
        }
    },
    lessonQuestion: {
        type: mongoose.Schema.ObjectId,
        ref: 'lessonQuestions',
    }

}, { timestamps: true });

lessonSchema.plugin(mongoosePaginate);
LessonTriggers(lessonSchema);

const Lesson = mongoose.model('lessons', lessonSchema)

module.exports = Lesson