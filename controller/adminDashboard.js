const Lesson = require("../models/Lessons");
// const Layout1 = require("../models/Layout1");
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

// const Layout2 = require("../models/Layout2");
// const Layout3 = require("../models/Layout3");
// const Layout4 = require("../models/Layout4");
// const Layout5 = require("../models/Layout5");
// const PdfFile = require("../models/pdfFile");
// const Student = require("../models/student.model");
// const Notification = require("../models/notification");
// const User = require("../models/user.model");
// const Comment = require("../models/comment");
// const SchoolYear = require("../models/schoolYear");
const Subject = require("../models/subjects");
const { logs } = require('../controller/LogsFile');
// const PDFDocument = require('pdfkit');
// const lessonQuestion = require("../models/LessonQuestion");
const lessonProgress = require("../models/lessonsProgress");
const lessonStats = require("../models/lessonStats");
const subjectStats = require("../models/subjectStats");
const moment = require('moment');
const Student = require("../models/student.model");


async function countTodayLessonAccess(subjectId) {
    try {
        // หา subject ที่มี subjectId ตรงกับที่กำหนด
        const subject = await Subject.findOne({ _id: subjectId });
        if (!subject) {
            throw new Error('Subject not found');
        }

        // รับค่า lessonArray จาก subject
        const lessonArray = subject.lessonArray;

        // กำหนดช่วงเวลาสำหรับวันนี้
        const startOfToday = moment().startOf('day').toDate();
        const endOfToday = moment().endOf('day').toDate();

        // กำหนดช่วงเวลาสำหรับเมื่อวาน
        const startOfYesterday = moment().subtract(1, 'days').startOf('day').toDate();
        const endOfYesterday = moment().subtract(1, 'days').endOf('day').toDate();

        // ค้นหาจำนวนผู้เข้าถึงบทเรียนในวันนี้
        const todayUsers = await lessonProgress.aggregate([
            {
                $match: {
                    lesson: { $in: lessonArray },
                    updatedAt: { $gte: startOfToday, $lt: endOfToday }
                }
            },
            {
                $group: {
                    _id: "$user" // จัดกลุ่มโดยใช้ user _id เพื่อหลีกเลี่ยงการนับซ้ำ
                }
            },
            {
                $count: "uniqueUserCount"
            }
        ]);

        // ค้นหาจำนวนผู้เข้าถึงบทเรียนเมื่อวาน
        const yesterdayUsers = await lessonProgress.aggregate([
            {
                $match: {
                    lesson: { $in: lessonArray },
                    updatedAt: { $gte: startOfYesterday, $lt: endOfYesterday }
                }
            },
            {
                $group: {
                    _id: "$user"
                }
            },
            {
                $count: "uniqueUserCount"
            }
        ]);

        // คำนวณจำนวนผู้ใช้งานในวันนี้และเมื่อวาน
        const todayCount = todayUsers.length > 0 ? todayUsers[0].uniqueUserCount : 0;
        const yesterdayCount = yesterdayUsers.length > 0 ? yesterdayUsers[0].uniqueUserCount : 0;

        // คำนวณความแตกต่างของจำนวนผู้ใช้งาน
        const difference = todayCount - yesterdayCount;

        // กำหนดข้อความสำหรับผลลัพธ์
        let resultMessage = "";
        if (difference > 0) {
            resultMessage = `เพิ่มขึ้น ${difference} คนจากเมื่อวาน`;
        } else if (difference < 0) {
            resultMessage = `ลดลง ${Math.abs(difference)} คนจากเมื่อวาน`;
        } else {
            resultMessage = `จำนวนผู้เข้าถึงเท่ากับเมื่อวาน`;
        }

        return {
            todayCount,
            yesterdayCount,
            difference,
            resultMessage
        };

    } catch (error) {
        console.error(error);
        return 0; // คืนค่า 0 หากเกิดข้อผิดพลาด
    }
}

const adminDashboard = async (req, res) => {
    try {
        const subjectId = req.query.subjectId; // รับ subjectId จาก query string

        let latestSubject;
        if (subjectId) {
            latestSubject = await Subject.findOne({ _id: subjectId }).populate("lessonArray");
        } else {
            // latestSubject = await Subject.findOne({ _id: "66a5b280abf2f346ab789a54" }).populate("lessonArray");
            latestSubject = await Subject.findOne().populate("lessonArray").sort({ createdAt: -1 });
        }

        if (latestSubject != null) {
            // ดึงข้อมูล subject ทั้งหมดเพื่อแสดงใน dropdown
            const subjects = await Subject.find().sort({ "createdAt": 1 });

            const lessonProgressList = await lessonProgress.find({ subjectMongooseId: latestSubject._id }).populate('lesson'); // populate เฉพาะฟิลด์ lessonName จาก lesson model

            const today = new Date();
            // กำหนดช่วงเวลาของวันที่ปัจจุบัน ตั้งแต่ 00:00:00 ถึง 23:59:59
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            const lessonFinishedToday = await lessonProgress.find(
                {
                    subjectMongooseId: latestSubject._id,
                    'finishedProgress.finishehDate': {
                        $gte: startOfDay, // เริ่มต้นที่ 00:00:00
                        $lte: endOfDay   // สิ้นสุดที่ 23:59:59
                    }
                });

            const totalLessons = latestSubject.lessonArray.length;
            const studentAmount = latestSubject.students.length;

            // สร้างตัวแปร array เพื่อเก็บผลลัพธ์
            let lessonProgressArray = [];

            // ใช้ Map เพื่อจัดกลุ่มตาม lesson._id
            let lessonMap = new Map();

            // ดึงข้อมูลบทเรียนทั้งหมดจาก subject (ตั้งค่าเริ่มต้นเป็น 0 สำหรับทุกบทเรียน)
            latestSubject.lessonArray.forEach(lesson => {
                const lessonId = lesson._id.toString();
                const lessonName = lesson.LessonName;

                // เพิ่มบทเรียนทั้งหมดเข้าไปใน Map และตั้งค่า lessonFinishedProgressAmount เป็น 0
                lessonMap.set(lessonId, {
                    lessonName: lessonName,
                    lessonFinishedProgressAmount: 0 // เริ่มต้นที่ 0
                });
            });
            
            // วนลูปข้อมูล lessonProgress ที่ได้มาและเพิ่มจำนวนคนที่ทำเสร็จ
            lessonProgressList.forEach(progress => {
                const lessonId = progress.lesson._id.toString();
                const isFinished = progress.progress == 100;

                // ถ้า progress เท่ากับ 100 ให้เพิ่มจำนวนคนที่ทำเสร็จ
                if (isFinished) {
                    lessonMap.get(lessonId).lessonFinishedProgressAmount += 1;
                }
            });

            // เปลี่ยนข้อมูลจาก Map เป็น array ของ object
            lessonMap.forEach((value, key) => {
                lessonProgressArray.push(value);
            });

            // console.log(lessonProgressArray);
            // [
            //     { lessonName: 'JavaScript', lessonFinishedProgressAmount: 1 },
            //     { lessonName: 'React.js', lessonFinishedProgressAmount: 1 }
            //   ]


            // // return หรือส่งข้อมูลไปยังส่วนอื่น ๆ
            // // res.json(lessonProgressArray);
            let lessonLabels = [];
            let progressData = [];
            let lessonProgressPercentSummary = [];

            

            lessonProgressArray.forEach(lesson => {
                lessonLabels.push(lesson.lessonName);
                progressData.push(lesson.lessonFinishedProgressAmount);
                
                //หา ว่าบทเรียนนั้นมีกี่คนที่สำเร็จ 100 เปอร์เซ็น 
                // สูตร (จำนวนคนที่ทำสำเร็จ / จำนวนคนทั้งหมด) = lessonFinishedProgressAmount / studentAmount 
                lessonProgressPercentSummary.push(
                    ((lesson.lessonFinishedProgressAmount / studentAmount))
                );
            });
            // console.log(lessonProgressPercentSummary);

            // totalProgress ผลรวมจำนวนนักเรียนคนที่เสร็จบทเรียนในแต่ละบท 
            const totalProgress = lessonProgressPercentSummary.reduce((sum, progress) => sum + progress, 0);
           
            
            const totalMaxProgress = (totalProgress / totalLessons ) * 100; // ค่าที่คาดหวัง (100%)
            
            // const finalPercentage = (totalProgress / totalMaxProgress) * 100;
            const finalPercentageTofixed = parseFloat(totalMaxProgress.toFixed(2))
            let calculateTodayProgress = await countTodayLessonAccess(latestSubject._id)
            // res.json(countToday);
            // console.log(countToday);
            // res.json(progressData)
            console.log(lessonLabels);
            res.render('teacherDashboard', {
                subjects,
                latestSubject,
                lessonLabels,
                progressData,
                studentAmount,
                totalLessons,
                lessonFinishedToday,
                finalPercentageTofixed,
                countToday: calculateTodayProgress.todayCount, // ส่งค่าจำนวนผู้เข้าถึงในวันนี้
                yesterdayCount: calculateTodayProgress.yesterdayCount, // ส่งค่าจำนวนผู้เข้าถึงเมื่อวาน
                difference: calculateTodayProgress.difference, // ส่งค่าเปอร์เซ็นต์การเปลี่ยนแปลง
                message: calculateTodayProgress.resultMessage // ส่งข้อความสำหรับผลลัพธ์
            })
        } else {
            const subjects = await Subject.find().sort({ "createdAt": 1 });

            // res.json("subject no");
            // let subjects = [];
            latestSubject = null;
            let lessonLabels = [];
            let progressData = [];
            let studentAmount = [];
            res.render('teacherDashboard', {latestSubject, subjects, lessonLabels, progressData, studentAmount});
        }


        // res.json(latestSubject)
    } catch (err) {
        console.log(err);
        // console.log(err);
        const subjects = await Subject.find().sort({ "createdAt": 1 });
        latestSubject = null;
        let lessonLabels = [];
        let progressData = [];
        let studentAmount = [];
        res.render('teacherDashboard', {latestSubject, subjects, lessonLabels, progressData, studentAmount});

    }
}

const progressHistory = async (req, res) => {
    try {
        res.render('progressHistory')
    } catch (err) {
        console.log(err);
    }
}

const moreDetailChart = async (req, res) => {
    try {
        const subjectId = req.query.subjectId;
        const findSubject = await Subject.findById(subjectId).populate({
            path: "students",
            populate: {
                path: "user",
            }
        });

        // ดึงข้อมูล subject ทั้งหมดเพื่อแสดงใน dropdown
        const subjects = await Subject.find().sort({ "createdAt": 1 });
        const page = parseInt(req.query.page) || 1;
        const pageSize = 10; // จำนวนข้อมูลต่อหน้า
        // const paginatedLayouts = paginate(foundLayouts, pageSize, page);
        const totalPages = Math.ceil(findSubject.students.length / pageSize);

        // ตรวจสอบว่า paginate มีการนำเข้าและใช้งานถูกต้อง
        function paginate(array, pageSize, page) {
            return array.slice((page - 1) * pageSize, page * pageSize);
        }

        const paginateStudents = paginate(findSubject.students, pageSize, page);

        const findSubjectStats = await subjectStats.findOne({ subject: subjectId });
        let eachLessonProgress = [];
        // let studentArray = findSubject.students;
        for (const each of findSubject.students) {
            var findLessonProgress = await lessonProgress.find({
                user: each.user._id,
                subjectMongooseId: subjectId
            });
            if (findLessonProgress.length > 0) {
                var progressSummary = 0;
                var lessonProgressLength = 0;
                var totalTimeSpent = 0;

                for (const x of findLessonProgress) {
                    progressSummary = progressSummary + x.progress;
                    lessonProgressLength = lessonProgressLength + 1;
                    totalTimeSpent = totalTimeSpent + x.timeSpentInSeconds;
                }

                const eachUserProgress = {
                    userId: each.user._id,
                    userProgressSummary: progressSummary,
                    lessonProgressLength,
                    totalTimeSpent,

                }

                eachLessonProgress.push(eachUserProgress);
            } else {
                const eachUserProgress = {
                    userId: each.user._id,
                    userProgressSummary: 0,
                    lessonProgressLength: 0,
                    totalTimeSpent: 0,

                }
                eachLessonProgress.push(eachUserProgress);
            }

            // if (findLessonProgress.length > 0) {
            //     eachLessonProgress.push(findLessonProgress);
            // }
        }
        eachLessonProgress.forEach(userProgress => {
            // คำนวณเปอร์เซ็นต์ใหม่ โดยเอา userProgressSummary ไปหารกับจำนวนบทเรียนทั้งหมด
            if (findSubjectStats) {
                let newProgress =
                    (userProgress.userProgressSummary)
                    /
                    findSubjectStats.lessonArray.length;
                userProgress.userProgressSummary = newProgress;

            }


            // console.log(`User ${userProgress.userId} มี progress ใหม่คือ ${newProgress.toFixed(2)}% จากบทเรียนทั้งหมด`);
        });
        const paginateProgress = paginate(eachLessonProgress, pageSize, page);

        // res.json(eachLessonProgress);
        res.render('moreDetailChart', {
            paginateStudents,
            totalPages,
            currentPage: page,
            subjectId,
            paginateProgress,
            subjects,
            findSubject
        });
        // studentArray.forEach(student => {
        //     // Find the matching progress object in eachLessonProgress
        //     let matchingProgress = eachLessonProgress.find(progress => progress.userId === student.user._id);

        //     if (matchingProgress) {
        //         console.log('Match found for userId:', student.user._id); // log when a match is found

        //         // ตรวจสอบว่าข้อมูลใน matchingProgress มีอยู่จริงหรือไม่
        //         if (matchingProgress.userProgressSummary && matchingProgress.lessonProgressLength && matchingProgress.totalTimeSpent) {
        //             student.userProgressSummary = matchingProgress.userProgressSummary;
        //             student.lessonProgressLength = matchingProgress.lessonProgressLength;
        //             student.totalTimeSpent = matchingProgress.totalTimeSpent;
        //         } else {
        //             console.log('Missing data in matchingProgress for userId:', student.user._id);
        //         }
        //     } else {
        //         console.log('No match found for userId:', student.user._id); // log when no match is found
        //     }
        // });
        // res.json(studentArray);
        // res.json(eachLessonProgress[0].userProgressSummary);
    } catch (err) {
        console.log(err);
    }
}

const studentDetail = async (req, res) => {
    try {
        const studentId = req.query.studentId;
        const subjectId = req.query.subjectId;
        const subjects = await Subject.find(
            { students: studentId }
        ).sort({ "createdAt": 1 });

        const findStudent = await Student.findOne(
            {
                _id: studentId,
                "subjects.subjectMongooseId": subjectId
            }
        ).populate("user");
        // console.log(findStudent);
        const subjectHasLessons = await Subject.findById(subjectId).populate("lessonArray");;
        // res.json(findStudent);
        // const completedCount = completedLayouts.filter(layoutId => layoutLists.includes(layoutId)).length;

        // let allLessonProgress;
        // if ()
        const allLessonProgress = await lessonProgress.find(
            {
                user: findStudent.user._id,
                subjectMongooseId: subjectId
            }
        ).populate("lesson");

        let lessonLabels = [];
        let progressData = [];
        let timeSpent = [];

        subjectHasLessons.lessonArray.forEach((eachLesson, index) => {
            const lessonId = eachLesson._id.toString();
            const foundLessonProgress = allLessonProgress.some(progress => progress.lesson._id.toString() === lessonId);

            if (foundLessonProgress) {
                lessonLabels.push(eachLesson.LessonName);
                progressData.push(allLessonProgress[index].progress);
                timeSpent.push(allLessonProgress[index].timeSpentInSeconds);

            } else if (!foundLessonProgress) {
                lessonLabels.push(eachLesson.LessonName);
                progressData.push(0);
                timeSpent.push(0);
            }
        })
        let total = progressData.reduce((accumulator, currentValue) => {
            return accumulator + currentValue;
        }, 0);

        let allFinishedProgressLesson = (total / subjectHasLessons.lessonArray.length).toFixed(2);
        // res.json(allLessonProgress);
        res.render('studentDetailChart', {
            findStudent,
            lessonLabels,
            progressData,
            subjects,
            subjectId,
            studentId,
            allFinishedProgressLesson,
            timeSpent
        })
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    adminDashboard,
    progressHistory,
    moreDetailChart,
    studentDetail
}