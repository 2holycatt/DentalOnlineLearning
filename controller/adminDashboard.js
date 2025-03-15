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
const User = require("../models/user.model");


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
        const subjectId = req.query.subjectId;
        const contentType = req.query.contentType || 'lesson';
        const userData = await User.findById(req.session.userId);
        const theme = req.session.theme || 'light';
        const isSidebarOpen = false;
        
        // ดึงข้อมูล subjects สำหรับ dropdown
        const subjects = await Subject.find().sort({ "createdAt": 1 });

        // เตรียมตัวแปรสำหรับส่งไป view
        let chartData = [];
        let chartLabels = [];
        let additionalData = {};
        let lessonLabels = []; // เพิ่มตัวแปรนี้
        let progressData = []; // เพิ่มตัวแปรนี้
        let lessonFinishedToday = [];
        // ดึงข้อมูลรายวิชา
        const latestSubject = subjectId ? 
            await Subject.findById(subjectId)
                .populate("lessonArray")
                .populate("quizArray")
                .populate("Assignments") :
            await Subject.findOne()
                .populate("lessonArray")
                .populate("quizArray")
                .populate("Assignments")
                .sort({ createdAt: -1 });

        if (latestSubject) {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            lessonFinishedToday = await lessonProgress.find({
                subjectMongooseId: latestSubject._id,
                'finishedProgress.finishehDate': {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            }).populate('lesson user');

            switch(contentType) {
                case 'quiz':
                    chartLabels = latestSubject.quizArray.map(quiz => quiz.quizname);
                    chartData = latestSubject.quizArray.map(quiz => 
                        quiz.attempts ? quiz.attempts.length : 0
                    );
                    lessonLabels = chartLabels; // ใช้ข้อมูลเดียวกับ chartLabels
                    progressData = chartData; // ใช้ข้อมูลเดียวกับ chartData
                    additionalData = {
                        totalItems: latestSubject.quizArray.length,
                        itemType: 'แบบทดสอบ',
                        studentAmount: latestSubject.students.length
                    };
                    break;

                case 'assignment':
                    chartLabels = latestSubject.Assignments.map(assign => assign.name);
                    chartData = latestSubject.Assignments.map(assign => 
                        assign.submitDetail ? assign.submitDetail.length : 0
                    );
                    lessonLabels = chartLabels;
                    progressData = chartData;
                    additionalData = {
                        totalItems: latestSubject.Assignments.length,
                        itemType: 'งานที่มอบหมาย',
                        studentAmount: latestSubject.students.length
                    };
                    break;

                default: // กรณี lesson
                    const lessonProgressList = await lessonProgress.find({
                        subjectMongooseId: latestSubject._id
                    }).populate('lesson');

                    // สร้าง Map เก็บข้อมูลบทเรียน
                    const lessonMap = new Map();
                    latestSubject.lessonArray.forEach(lesson => {
                        lessonMap.set(lesson._id.toString(), {
                            lessonName: lesson.LessonName,
                            lessonFinishedProgressAmount: 0
                        });
                    });

                    // นับจำนวนผู้เรียนที่ทำเสร็จแต่ละบทเรียน
                    lessonProgressList.forEach(progress => {
                        if (progress.progress === 100) {
                            const lessonData = lessonMap.get(progress.lesson._id.toString());
                            if (lessonData) {
                                lessonData.lessonFinishedProgressAmount += 1;
                            }
                        }
                    });

                    const lessonProgressArray = Array.from(lessonMap.values());
                    chartLabels = lessonProgressArray.map(lesson => lesson.lessonName);
                    chartData = lessonProgressArray.map(lesson => lesson.lessonFinishedProgressAmount);
                    lessonLabels = chartLabels;
                    progressData = chartData;

                    const studentAmount = latestSubject.students.length;
                    const totalLessons = latestSubject.lessonArray.length;
                    
                    additionalData = {
                        studentAmount,
                        totalLessons,
                        finalPercentageTofixed: calculateTotalProgress(chartData, studentAmount, totalLessons)
                    };
                    break;
            }
        }

        // ดึงข้อมูลการเข้าถึงวันนี้
        const calculateTodayProgress = latestSubject ? 
            await countTodayLessonAccess(latestSubject._id) : 
            { todayCount: 0, yesterdayCount: 0, difference: 0, resultMessage: '' };

        // Render dashboard
        res.render('teacherDashboard', {
            subjects,
            latestSubject,
            chartLabels,
            chartData,
            lessonLabels,
            progressData,
            contentType,
            userData,
            theme,
            isSidebarOpen,
            countToday: calculateTodayProgress.todayCount,
            yesterdayCount: calculateTodayProgress.yesterdayCount,
            difference: calculateTodayProgress.difference,
            message: calculateTodayProgress.resultMessage,
            lessonFinishedToday,
            ...additionalData
        });

    } catch (err) {
        console.error('Dashboard Error:', err);
        res.render('teacherDashboard', {
            latestSubject: null,
            subjects: await Subject.find().sort({ "createdAt": 1 }),
            chartLabels: [],
            chartData: [],
            lessonLabels: [],
            progressData: [],
            studentAmount: [],
            lessonFinishedToday: [],
            userData: await User.findById(req.session.userId),
            theme: req.session.theme || 'light',
            isSidebarOpen: false,
            contentType: req.query.contentType || 'lesson'
        });
    }
};

// เพิ่มฟังก์ชัน helper
function calculateTotalProgress(data, studentAmount, totalItems) {
    if (!studentAmount || !totalItems) return 0;
    const totalProgress = data.reduce((sum, amount) => sum + (amount / studentAmount), 0);
    return parseFloat(((totalProgress / totalItems) * 100).toFixed(2));
}

const progressHistory = async (req, res) => {
    try {
        res.render('progressHistory')
    } catch (err) {
        console.log(err);
    }
}

const moreDetailChart = async (req, res) => {
    const userData = await User.findById(req.session.userId);
    const theme = req.session.theme || 'light'; 
    const isSidebarOpen = false; 
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
            findSubject,
            theme,
            isSidebarOpen,
            userData
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
    const userData = await User.findById(req.session.userId);
    const theme = req.session.theme || 'light'; 
    const isSidebarOpen = false; 
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
            timeSpent,
            userData,
            theme,
            isSidebarOpen
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