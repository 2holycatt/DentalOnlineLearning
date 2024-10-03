const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Layout1Schema = new Schema({
    name:{
        type: 'string',
        default: 'Layout01'
    },
    Topic: {
        type: String,
    },
    MainDescription: {
        type: String,
    },
    SubDescription: {
        type: String,
    },
    AboutImage:[{
        title:{
            type: String
        },
        file:{
            type: String
        },
        contentType: {
            type: String,
        },
        ImageDescription:{
            type: String
        }
    }],
    LessonArrayObject:[
        {
            LessonId: {
                type:mongoose.Schema.Types.ObjectId,
                ref: 'lessons'
            }
        }
    ],
}, { timestamps: true });

const Layout1 = mongoose.model('Layout1s', Layout1Schema)

module.exports = Layout1