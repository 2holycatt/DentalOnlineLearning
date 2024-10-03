const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Layout3Schema = new Schema({
  name: {
    type: 'string',
    default: 'Layout03'
  },
  Description: {
    type: String,
  },
  file: {
    type: String
  },
  contentType: {
    type: String,
  }
  ,
  LessonArrayObject: [
    {
      LessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lessons'
      }
    }
  ],
}, { timestamps: true });

const Layout3 = mongoose.model('Layout3s', Layout3Schema);

module.exports = Layout3;
