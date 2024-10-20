async function calculateAndUpdateSubjectStats(subjectId) {
    const Subject = require('../models/subjects'); // นำเข้าโมเดลแบบ dynamic
    const SubjectStats = require("../models/subjectStats");

    try {
        const subject = await Subject.findById(subjectId).populate('lessonArray');
        
        // คำนวณข้อมูล
        let totalLayouts = 0;
        let totalPdfFiles = 0;

        subject.lessonArray.forEach(lesson => {
            totalLayouts += lesson.LayOut1ArrayObject.length +
                            lesson.LayOut2ArrayObject.length +
                            lesson.LayOut3ArrayObject.length +
                            lesson.LayOut4ArrayObject.length +
                            lesson.LayOut5ArrayObject.length +
                            lesson.TextEditors.length;

            totalPdfFiles += lesson.PdfFiles.length;
        });

        const totalContent = totalLayouts + totalPdfFiles;
        // const layoutProportion = (totalLayouts / totalContent) * 100;
        // const pdfProportion = (totalPdfFiles / totalContent) * 100;

        // อัปเดต subjectStats และเพิ่ม lessonArray
        await SubjectStats.findOneAndUpdate(
            { subject: subjectId },
            { 
                // totalLessons: subject.lessonArray.length, 
                lessonArray: subject.lessonArray.map(lesson => lesson._id) // เพิ่ม lessonArray
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error updating subject stats:', error);
    }
}

module.exports = { calculateAndUpdateSubjectStats,
 };

