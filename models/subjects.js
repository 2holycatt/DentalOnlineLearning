const mongoose = require('mongoose')
const SubjectTriggers = require('../triggers/subjectDatabaseTriggers');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const subjectYearSchema = new Schema(
    {
        subjectId: {
            type: String,
            default:null
        },
        subjectName: {
            type: String,
            default:null

        },
        description: {  
            type: String,
            default: null
        },
        semester: {
            type: String,
            default:null
        },
        unit: {
            type: Number,
            default:null

        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        section: {
            type: String,
            default:null
            
        },
        students: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Student',
            default: 0,
            weeks: [
                {
                    week: {
                        type: String
                    },
                    scorePerWeek: {
                        type: Number,
                        default: 0
                    }
                }
            ]
        }
        ],
        quizArray: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Quiz',
            default: 0,
            quizname: String
        }],
        lessonArray: [{
            type: mongoose.Schema.ObjectId,
            ref: 'lessons',
            default: 0,
            LessonName: String
        }],
        Assignments: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Assignments',
            default: 0,
            name: String
        }],
        isArchived: {
            type: Boolean,
            default: false
          }
    }, {
    timestamps: true
})

subjectYearSchema.index({ subjectId: 1, semester: 1, section: 1 }, { unique: true });

// Pre-delete middleware
subjectYearSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        // Delete related quizzes
        await this.model('Quiz').deleteMany({ _id: { $in: this.quizes } });
        
        // Delete related lessons
        await this.model('lessons').deleteMany({ _id: { $in: this.lessonArray } });
        
        // Delete related assignments
        await this.model('Assignments').deleteMany({ _id: { $in: this.Assignments } });
        
        next();
    } catch (error) {
        next(error);
    }
});


subjectYearSchema.plugin(mongoosePaginate);
SubjectTriggers(subjectYearSchema);

const Subject = mongoose.model('subject', subjectYearSchema)

module.exports = Subject;