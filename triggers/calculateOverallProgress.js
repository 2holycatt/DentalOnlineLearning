async function calculateProgress(subjectId, lessonId) {
    const LessonStats = require("../models/lessonStats");
    const LessonProgress = require("../models/lessonsProgress");
    // console.log(
    //     "นี่คือ Id: " + subjectId
    // );
    try {

        // ดึงข้อมูล lessonStats สำหรับบทเรียนที่กำหนด
        const lessonStats = await LessonStats.findOne({ subject: subjectId, lesson: lessonId });
        // if (!lessonStats) {
        //     throw new Error('LessonStats not found');
        // }

        // ดึงข้อมูล lessonProgress สำหรับผู้ใช้และบทเรียนที่กำหนด
        const lessonProgress = await LessonProgress.find({ subjectMongooseId: subjectId, lesson: lessonId  });
        // if (!lessonProgress) {
        //     return 0; // ถ้าไม่มีข้อมูล progress ให้เริ่มต้นที่ 0%
        // }

        // ดึง layoutLists จาก lessonStats
        // console.log(lessonProgress);
        const layoutLists = lessonStats.layoutLists.map(item => item.layoutId.toString());

        lessonProgress.forEach(async lessonP => {
            // ดึง completedLayouts จาก lessonProgress
            const completedLayouts = lessonP.completedLayouts.map(item => item.layoutId.toString());

            // คำนวณจำนวน layout ที่ถูกทำเครื่องหมายว่าเสร็จแล้ว
            const completedCount = completedLayouts.filter(layoutId => layoutLists.includes(layoutId)).length;
            console.log(completedCount);
            // คำนวณ totalContent จาก layoutLists
            const totalContent = layoutLists.length;

            const progress = totalContent > 0 ? (completedCount / totalContent) * 100 : 0;
            console.log(progress);
            const updateLesson = await LessonProgress.findOneAndUpdate(
                {
                    subjectMongooseId: subjectId,
                    _id: lessonP._id
                },
                {
                    $set : {
                        progress:progress
                    }
                },
                {
                    new:true
                }
            )
        });

        // return progress;
    } catch (error) {
        console.error('Error calculating progress:', error);
        return 0;
    }
}

module.exports = {
    calculateProgress
}