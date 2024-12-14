const LessonProgress = require('../models/lessonsProgress');
const LessonStats = require('../models/lessonStats');
const User = require('../models/user.model');
const Lesson = require('../models/Lessons'); // อย่าลืมนำเข้าโมเดล Lessons

async function calculateProgress(userId, lessonId) {
    try {
        // ดึงข้อมูล lessonStats สำหรับบทเรียนที่กำหนด
        const lessonStats = await LessonStats.findOne({ lesson: lessonId });
        if (!lessonStats) {
            throw new Error('LessonStats not found');
        }

        // ดึงข้อมูล lessonProgress สำหรับผู้ใช้และบทเรียนที่กำหนด
        const lessonProgress = await LessonProgress.findOne({ user: userId, lesson: lessonId });
        if (!lessonProgress) {
            return 0; // ถ้าไม่มีข้อมูล progress ให้เริ่มต้นที่ 0%
        }

        // ดึง layoutLists จาก lessonStats
        const layoutLists = lessonStats.layoutLists.map(item => item.layoutId.toString());

        // ดึง completedLayouts จาก lessonProgress
        const completedLayouts = lessonProgress.completedLayouts.map(item => item.layoutId.toString());

        // คำนวณจำนวน layout ที่ถูกทำเครื่องหมายว่าเสร็จแล้ว
        const completedCount = completedLayouts.filter(layoutId => layoutLists.includes(layoutId)).length;

        // คำนวณ totalContent จาก layoutLists
        const totalContent = layoutLists.length;

        // คำนวณเปอร์เซ็นต์ความคืบหน้า
        const progress = totalContent > 0 ? (completedCount / totalContent) * 100 : 0;

        return progress;
    } catch (error) {
        console.error('Error calculating progress:', error);
        return 0;
    }
}


const updateLessonProgress = async (req, res) => {
    const { layoutId, layoutType, lessonId, timeSpent, subjectId } = req.body; // เพิ่ม lessonId ใน body ถ้ายังไม่ได้ส่ง
    // console.log(subjectId);
    const userId = req.session.userId; // สมมติว่ามีการตรวจสอบผู้ใช้แล้ว

    try {
        // อัปเดต completedLayouts ด้วย layoutId และ type
        // const lessonProgress = await LessonProgress.findOneAndUpdate(
        //     { user: userId, lesson: lessonId },
        //     {
        //         user: userId,
        //         lesson: lessonId,
        //         timeSpentInSeconds: timeSpent
        //     },
        //     {
        //         upsert: true, new: true
        //     }
        // );
        const isExistLessonProgress = await LessonProgress.findOne({ user: userId, lesson: lessonId });

        if (!isExistLessonProgress) {
            const newLessonProgress = new LessonProgress({
                user: userId,
                lesson: lessonId,
                timeSpentInSeconds: timeSpent,
                subjectMongooseId: subjectId
            });
            await newLessonProgress.save();

            const lessonStats = await LessonStats.findOne({ lesson: lessonId });
            const layoutLists = lessonStats.layoutLists;

            const completedLayouts = newLessonProgress.completedLayouts;

            // const isLayoutCompleted = completedLayouts.includes(layoutId);
            // console.log(isLayoutCompleted);
            const isLayoutCompleted = completedLayouts.some(layout => layout.layoutId.toString() === layoutId.toString());

            if (isLayoutCompleted) {
                console.log('Layout is already completed.');
            } else if (!isLayoutCompleted) {
                await LessonProgress.findOneAndUpdate(
                    { _id: newLessonProgress._id },
                    {
                        $push: {
                            completedLayouts: { layoutId: layoutId, type: layoutType }
                        }
                    },
                    { new: true }
                );
            }

            // for (const layout of layoutLists) {
            //     // console.log("not exist lessonProgress: "+newLessonProgress);

            //     // เช็คว่ามี layoutId นี้ใน completedLayouts หรือไม่
            //     const layoutExistsCheck = newLessonProgress.completedLayouts.some(
            //         (completedLayout) => completedLayout.layoutId.toString() === layout.layoutId.toString()
            //     );
            //     // console.log(layoutExists);
            //     if (layoutExistsCheck == false) { // สามารถใช้ได้เช่นกัน
            //         // อัปเดต completedLayouts โดยไม่เพิ่ม layout ซ้ำ
            //         await LessonProgress.findOneAndUpdate(
            //             { _id: newLessonProgress._id },
            //             {
            //                 $push: {
            //                     completedLayouts: { layoutId: layoutId, type: layoutType }
            //                 }
            //             },
            //             { new: true }
            //         );
            //     }

            //     // คำนวณความคืบหน้า

            // }
            const progress = await calculateProgress(userId, lessonId);

            // อัปเดต field progress ใน lessonProgressSchema
            newLessonProgress.progress = progress;
            await newLessonProgress.save();
            res.status(200).json({ success: true, progress: newLessonProgress.progress });
        } else if (isExistLessonProgress) {
            const completedLayouts = isExistLessonProgress.completedLayouts;
            // console.log("exist lessonProgress: "+isExistLessonProgress);
            // const lessonProgress = await LessonProgress.findOne({ user: userId, lesson: lessonId });
            // const lessonStats = await LessonStats.findOne({ lesson: lessonId });
            // const layoutLists = lessonStats.layoutLists;
            // const isLayoutCompleted = completedLayouts.includes(layoutId);
            // console.log(isLayoutCompleted);
            const isLayoutCompleted = completedLayouts.some(layout => layout.layoutId.toString() === layoutId.toString());

            if (isLayoutCompleted) {
                console.log('Layout is already completed.');
            } else if (!isLayoutCompleted) {
                await LessonProgress.findOneAndUpdate(
                    { _id: isExistLessonProgress._id },
                    {
                        $push: {
                            completedLayouts: { layoutId: layoutId, type: layoutType }
                        }
                    },
                    { new: true }
                );
            }

            // for (const layout of layoutLists) {

            //     // เช็คว่ามี layoutId นี้ใน completedLayouts หรือไม่
            //     const layoutExists = isExistLessonProgress.completedLayouts.some(
            //         (completedLayout) => completedLayout.layoutId.toString() === layout.layoutId.toString()
            //     );
            //     // console.log(layoutExists);
            //     if (layoutExists == false) { // สามารถใช้ได้เช่นกัน
            //         // อัปเดต completedLayouts โดยไม่เพิ่ม layout ซ้ำ

            //     }
            // }

            // คำนวณความคืบหน้า
            const progress = await calculateProgress(userId, lessonId);

            // อัปเดต field progress ใน lessonProgressSchema
            isExistLessonProgress.progress = progress;
            isExistLessonProgress.subjectMongooseId = subjectId;
            await isExistLessonProgress.save();
            res.status(200).json({ success: true, progress: isExistLessonProgress.progress });

        }
        // console.log(lessonProgress);
        // const completedLayouts = lessonProgress.completedLayouts;

        // const lessonProgressUpdate = await LessonProgress.findOneAndUpdate(
        //     { user: userId, lesson: lessonId }, // แทนที่ด้วยข้อมูลบทเรียนที่เกี่ยวข้อง
        //     { 
        //         $addToSet: { 
        //             completedLayouts: { layoutId, type: layoutType }
        //         } 
        //     },
        //     { upsert: true, new: true }
        // );

    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ success: false, message: 'Failed to update progress' });
    }
};

const calculateTimeSpent = async (req, res, next) => {
    const { lessonId, timeSpent, subjectId } = req.body; // เพิ่ม subjectId ใน body
    const userId = req.session.userId; // สมมติว่ามีการตรวจสอบผู้ใช้แล้ว

    try {
        let lessonProgress = await LessonProgress.findOne({ lesson: lessonId, user: userId });
        let lesson = await Lesson.findById(lessonId);
        let user = await User.findById(req.session.userId);

        if (lessonProgress) {
            // ถ้ามีอยู่แล้ว ให้เพิ่มค่า timeSpentInSeconds ใหม่เข้าไปในค่าที่มีอยู่
            lessonProgress.timeSpentInSeconds += timeSpent;

            // เช็คว่ามี subjectMongooseId แล้วหรือไม่ ถ้าไม่มีให้เพิ่ม
            if (!lessonProgress.subject) {
                lessonProgress.subject = subjectId;
            }

            await lessonProgress.save();

            if (
                (lessonProgress.progress == 100 && lessonProgress.finishedProgress.checkFinished != true)
                ||
                (lessonProgress.progress < 100 && lessonProgress.finishedProgress.checkFinished == true)
            ) {
                const currentDate = new Date();
               
                console.log(currentDate);

                const finishedProgress = {
                    checkFinished: true,
                    message: user.name + " เรียนบทเรียน " + lesson.LessonName + "ครบแล้ว",
                    finishehDate: dateObject
                }

                const updateLessonProgress = await LessonProgress.findByIdAndUpdate(
                    { _id: lessonProgress._id },
                    {
                        $set: {
                            finishedProgress: finishedProgress
                        }
                    },
                    { new: true }
                )

                // console.log("updated");
            }
            // res.json({ success: true, message: 'Updated timeSpentInSeconds successfully', timeSpent: lessonProgress.timeSpentInSeconds });
        } else {
            // ถ้าไม่มี ให้สร้าง progress ใหม่สำหรับ lesson นั้น
            lessonProgress = new LessonProgress({
                user: userId,
                lesson: lessonId,
                timeSpentInSeconds: timeSpent,
                subject: subjectId // เพิ่ม subjectMongooseId เข้าไปเมื่อสร้างใหม่
            });

            await lessonProgress.save();
            // res.json({ success: true, message: 'Created new lesson progress', timeSpent: lessonProgress.timeSpentInSeconds });
        }

    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ success: false, message: 'Failed to update progress' });
    }
};


module.exports = {
    updateLessonProgress,
    calculateTimeSpent
}
