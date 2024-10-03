async function calculateLessonStats(lessonId) {
    // ดึงข้อมูล Layouts และ PdfFiles จากบทเรียน
    const Lesson = require('../models/Lessons'); // นำเข้าโมเดลแบบ dynamic
    const lessonStats = require("../models/lessonStats");
    const lesson = await Lesson.findById(lessonId)
        .populate('LayOut1ArrayObject')
        .populate('LayOut2ArrayObject')
        .populate('LayOut3ArrayObject')
        .populate('LayOut4ArrayObject')
        .populate('PdfFiles');

    // นับจำนวน Layouts และ PdfFiles ทั้งหมด
    const totalLayouts = lesson.LayOut1ArrayObject.length + lesson.LayOut2ArrayObject.length + lesson.LayOut3ArrayObject.length + lesson.LayOut4ArrayObject.length;
    const totalPdfFiles = lesson.PdfFiles.length;

    // คำนวณสัดส่วน (%) ของ Layouts และ PDFs
    const totalContent = totalLayouts + totalPdfFiles;
    const layoutProportion = totalLayouts > 0 ? (totalLayouts / totalContent) * 100 : 0;
    const pdfProportion = totalPdfFiles > 0 ? (totalPdfFiles / totalContent) * 100 : 0;

    // บันทึกผลการคำนวณลงใน SubjectLessonStats
    // await lessonStats.create({
    //     lesson: lessonId,
    //     totalLayouts: totalLayouts,
    //     totalPdfFiles: totalPdfFiles,
    //     layoutProportion: layoutProportion,
    //     pdfProportion: pdfProportion
    // });

    // สร้าง array สำหรับเก็บ layoutLists (_id และ type)
    const layoutLists = [
        ...lesson.LayOut1ArrayObject.map(layout => ({ layoutId: layout._id, type: 'Layout1s' })),
        ...lesson.LayOut2ArrayObject.map(layout => ({ layoutId: layout._id, type: 'Layout2s' })),
        ...lesson.LayOut3ArrayObject.map(layout => ({ layoutId: layout._id, type: 'Layout3s' })),
        ...lesson.LayOut4ArrayObject.map(layout => ({ layoutId: layout._id, type: 'Layout4s' })),
        ...lesson.LayOut5ArrayObject.map(layout => ({ layoutId: layout._id, type: 'Layout5s' })),
        ...lesson.PdfFiles.map(pdf => ({ layoutId: pdf._id, type: 'pdfFile' }))
    ];

    await lessonStats.findOneAndUpdate(
        { lesson: lessonId },
        {
            totalLayouts,
            totalPdfFiles,
            layoutProportion,
            pdfProportion,
            layoutLists,
            subject:lesson.subject.subjectMongooseId
        },
        { upsert: true, new: true }
    );
}


module.exports = { 
    calculateLessonStats,
};