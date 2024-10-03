// triggers/databaseTriggers.js
// const Lesson = require("../models/Lessons");
// const Subject = require("../models/subjects");

// const SubjectStats = require("../models/subjectStats");
const { calculateAndUpdateSubjectStats } = require("./calculateSubjectStats");

// โค้ดใช้ตรวจสอบว่ามีการตรวจจับเอกสารที่อัปเดตหรือเปลี่ยนได้หรือไม่
const handleDocumentChange = (doc, changeType) => {
    console.log(`${changeType} in collection ${doc.constructor.modelName}`);
    console.log('Changed document:', JSON.stringify(doc, null, 2));
};

const SubjectTriggers = (schema) => {
    console.log(`Adding triggers to schema: ${schema.modelName}`);

    schema.pre('save', function (next) {
        console.log('Pre-save trigger activated');
        next();
    });

    schema.post('save', function (doc) {
        console.log('Post-save trigger activated');
        handleDocumentChange(doc, 'Save');
    });

    schema.post('findOneAndUpdate', async function (doc) {
        console.log('FindOneAndUpdate trigger activated');
        console.log('doc Id: '+ doc._id);
        // console.log(doc);
     
        if (doc) {
            await calculateAndUpdateSubjectStats(doc._id);
            console.log("Before calling calculateProgress");
            // try {
            //     await calculateProgress(doc._id);  // ลองจับ error รอบการเรียก calculateProgress
            //     console.log("After calling calculateProgress");
            // } catch (error) {
            //     console.error("Error in calculateProgress:", error);
            // }
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

module.exports = SubjectTriggers;