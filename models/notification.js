const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const notificationSchema = new Schema({
    date: {
        type: String,
    },
    notifications : [
        {
            about:{
                type: String,
            },
            name:{
                type: String,
            },
            time:{
                type: String
            },
            user:[{
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                default: 0
            }],
            isRead: {
                type: Boolean,
                default: false,
            }
        }
    ]
}, { timestamps: true });

notificationSchema.plugin(mongoosePaginate);

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification