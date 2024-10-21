const { calculateLessonStats } = require("./calculateLessonStats");
const { calculateProgress } = require("./calculateOverallProgress");

// โค้ดใช้ตรวจสอบว่ามีการตรวจจับเอกสารที่อัปเดตหรือเปลี่ยนได้หรือไม่
const handleDocumentChange = (doc, changeType) => {
    console.log(`${changeType} in collection ${doc.constructor.modelName}`);
    console.log('Changed document:', JSON.stringify(doc, null, 2));
};

const LessonTriggers = (schema) => {
    console.log(`Adding triggers to schema: ${schema.modelName}`);

    schema.pre('save', function (next) {
        console.log('Pre-save trigger activated');
        next();
    });

    schema.post('save', function (doc) {
        console.log('Post-save trigger activated');
        // handleDocumentChange(doc, 'Save');
        calculateLessonStats(doc._id);
    });

    schema.post('findOneAndUpdate', function (doc) {
        console.log('FindOneAndUpdate trigger activated');
        // console.log('doc Id: '+ doc._id);
        // console.log(doc);
        if (doc) {
            calculateLessonStats(doc._id);
            calculateProgress(doc.subject.subjectMongooseId, doc._id);
            // handleDocumentChange(doc, 'FindOneAndUpdate');
        } else {
            console.log('FindOneAndUpdate trigger activated, but no document returned');
        }
    });

    schema.post('updateOne', function (result) {
        console.log('UpdateOne trigger activated');
        console.log('Update result:', result);
    });

    schema.post('remove', function (doc) {
        console.log('Remove trigger activated');
        handleDocumentChange(doc, 'Remove');
    });
};

module.exports = LessonTriggers;