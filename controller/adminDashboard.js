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

async function getSubjectsForNav(userId) {
    try {
        const userData = await User.findById(userId);
        let subjects = [];
        
        if (!userData) {
            return [];
        }
  
        if (userData.role === 'student') {
            const studentData = await Student.findOne({ user: userId })
                .populate('subjects.subjectMongooseId');
            
            if (studentData && studentData.subjects) {
                subjects = studentData.subjects
                    .filter(subject => 
                        subject.subjectMongooseId && 
                        !subject.subjectMongooseId.isArchived)
                    .map(subject => subject.subjectMongooseId);
            }
        } else {
            // For teachers and admins, filter out archived subjects
            subjects = await Subject.find({ isArchived: false })
                .sort({ semester: 1 })
                .populate("lessonArray") || [];
        }
        
        return subjects;
    } catch (error) {
        console.error('Error in getSubjectsForNav:', error);
        return [];
    }
  }

  async function countTodayAccess(subjectId, contentType) {
    try {
        const subject = await Subject.findOne({ _id: subjectId })
            .populate('quizArray')
            .populate('Assignments');
            
        if (!subject) {
            throw new Error('Subject not found');
        }

        const startOfToday = moment().startOf('day').toDate();
        const endOfToday = moment().endOf('day').toDate();
        const startOfYesterday = moment().subtract(1, 'days').startOf('day').toDate();
        const endOfYesterday = moment().subtract(1, 'days').endOf('day').toDate();

        let todayCount = 0;
        let yesterdayCount = 0;
        let resultMessage = "";

        if (contentType === 'quiz') {
            // นับจำนวนผู้ทำแบบทดสอบวันนี้
            const todayAttempts = subject.quizArray.reduce((sum, quiz) => {
                return sum + (quiz.attempts || []).filter(attempt => 
                    moment(attempt.submittedAt).isBetween(startOfToday, endOfToday)
                ).length;
            }, 0);

            // นับจำนวนผู้ทำแบบทดสอบเมื่อวาน
            const yesterdayAttempts = subject.quizArray.reduce((sum, quiz) => {
                return sum + (quiz.attempts || []).filter(attempt => 
                    moment(attempt.submittedAt).isBetween(startOfYesterday, endOfYesterday)
                ).length;
            }, 0);

            todayCount = todayAttempts;
            yesterdayCount = yesterdayAttempts;

        } else if (contentType === 'assignment') {
            // นับจำนวนผู้ส่งงานวันนี้
            const todaySubmissions = subject.Assignments.reduce((sum, assignment) => {
                return sum + (assignment.submitDetail || []).filter(submit => 
                    moment(submit.submitTime).isBetween(startOfToday, endOfToday)
                ).length;
            }, 0);

            // นับจำนวนผู้ส่งงานเมื่อวาน
            const yesterdaySubmissions = subject.Assignments.reduce((sum, assignment) => {
                return sum + (assignment.submitDetail || []).filter(submit => 
                    moment(submit.submitTime).isBetween(startOfYesterday, endOfYesterday)
                ).length;
            }, 0);

            todayCount = todaySubmissions;
            yesterdayCount = yesterdaySubmissions;

        } else {
            // สำหรับบทเรียน (ใช้โค้ดเดิม)
            const todayUsers = await lessonProgress.aggregate([
                {
                    $match: {
                        lesson: { $in: subject.lessonArray },
                        updatedAt: { $gte: startOfToday, $lt: endOfToday }
                    }
                },
                {
                    $group: { _id: "$user" }
                },
                {
                    $count: "uniqueUserCount"
                }
            ]);

            const yesterdayUsers = await lessonProgress.aggregate([
                {
                    $match: {
                        lesson: { $in: subject.lessonArray },
                        updatedAt: { $gte: startOfYesterday, $lt: endOfYesterday }
                    }
                },
                {
                    $group: { _id: "$user" }
                },
                {
                    $count: "uniqueUserCount"
                }
            ]);

            todayCount = todayUsers.length > 0 ? todayUsers[0].uniqueUserCount : 0;
            yesterdayCount = yesterdayUsers.length > 0 ? yesterdayUsers[0].uniqueUserCount : 0;
        }

        const difference = todayCount - yesterdayCount;

        // สร้างข้อความตามประเภทเนื้อหา
        if (difference > 0) {
            resultMessage = contentType === 'quiz' ? 
                `มีผู้ทำแบบทดสอบเพิ่มขึ้น ${difference} คนจากเมื่อวาน` :
                contentType === 'assignment' ? 
                `มีผู้ส่งงานเพิ่มขึ้น ${difference} คนจากเมื่อวาน` :
                `เพิ่มขึ้น ${difference} คนจากเมื่อวาน`;
        } else if (difference < 0) {
            resultMessage = contentType === 'quiz' ? 
                `มีผู้ทำแบบทดสอบลดลง ${Math.abs(difference)} คนจากเมื่อวาน` :
                contentType === 'assignment' ? 
                `มีผู้ส่งงานลดลง ${Math.abs(difference)} คนจากเมื่อวาน` :
                `ลดลง ${Math.abs(difference)} คนจากเมื่อวาน`;
        } else {
            resultMessage = contentType === 'quiz' ? 
                'จำนวนผู้ทำแบบทดสอบเท่ากับเมื่อวาน' :
                contentType === 'assignment' ? 
                'จำนวนผู้ส่งงานเท่ากับเมื่อวาน' :
                'จำนวนผู้เข้าถึงเท่ากับเมื่อวาน';
        }

        return {
            todayCount,
            yesterdayCount,
            difference,
            resultMessage
        };

    } catch (error) {
        console.error(error);
        return {
            todayCount: 0,
            yesterdayCount: 0,
            difference: 0,
            resultMessage: 'เกิดข้อผิดพลาดในการนับจำนวน'
        };
    }
}

const adminDashboard = async (req, res) => {
    try {
        const navSubjects = await getSubjectsForNav(req.session.userId);
        const subjectId = req.query.subjectId;
        const contentType = req.query.contentType || 'lesson';
        const userData = await User.findById(req.session.userId);
        const theme = req.session.theme || 'light';
        const isSidebarOpen = false;
        
        // ดึงข้อมูล subjects สำหรับ dropdown
        const subjects = await Subject.find().sort({ "createdAt": 1 });

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

        const findSubject = subjectId ? 
        await Subject.findById(subjectId).populate({
            path: "students",
            populate: {
                path: "user",
            }
        }) : null;

    // ฟังก์ชัน paginate
    function paginate(array, pageSize, page) {
        if (!array) return [];
        return array.slice((page - 1) * pageSize, page * pageSize);
    }

         // กำหนดค่า pagination
         const page = parseInt(req.query.page) || 1;
         const pageSize = 10;
 
         // ดึงข้อมูล lesson progress
         let eachLessonProgress = [];
         if (findSubject) {
             for (const each of findSubject.students) {
                 let findLessonProgress = await lessonProgress.find({
                     user: each.user._id,
                     subjectMongooseId: subjectId
                 });
         
                 let progressData = {
                     userId: each.user._id,
                     userProgressSummary: 0,
                     lessonProgressLength: 0,
                     totalTimeSpent: 0
                 };
         
                 if (findLessonProgress.length > 0) {
                     if (contentType === 'quiz') {
                         // คำนวณสำหรับแบบทดสอบ
                         const totalQuizzes = latestSubject.quizArray.length;
                         const completedQuizzes = findLessonProgress.filter(p => p.progress === 100).length;
                         progressData.userProgressSummary = totalQuizzes > 0 ? 
                             (completedQuizzes / totalQuizzes) * 100 : 0;
                     } else if (contentType === 'assignment') {
                         // คำนวณสำหรับงานที่มอบหมาย
                         const totalAssignments = latestSubject.Assignments.length;
                         const completedAssignments = findLessonProgress.filter(p => p.progress === 100).length;
                         progressData.userProgressSummary = totalAssignments > 0 ? 
                             (completedAssignments / totalAssignments) * 100 : 0;
                     } else {
                         // คำนวณสำหรับบทเรียน
                         const totalProgress = findLessonProgress.reduce((sum, prog) => sum + prog.progress, 0);
                         const totalLessons = latestSubject.lessonArray.length;
                         progressData.userProgressSummary = totalLessons > 0 ? 
                             totalProgress / totalLessons : 0;
                     }
         
                     progressData.lessonProgressLength = findLessonProgress.length;
                     progressData.totalTimeSpent = findLessonProgress.reduce((sum, prog) => 
                         sum + (prog.timeSpentInSeconds || 0), 0) / 60; // แปลงวินาทีเป็นนาที
                 }
         
                 eachLessonProgress.push(progressData);
             }
         }
 
         // จัดการ pagination
         const paginateStudents = findSubject ? paginate(findSubject.students, pageSize, page) : [];
         const paginateProgress = paginate(eachLessonProgress, pageSize, page);


        // เตรียมตัวแปรสำหรับส่งไป view
        let chartData = [];
        let chartLabels = [];
        let additionalData = {};
        let lessonLabels = []; // เพิ่มตัวแปรนี้
        let progressData = []; // เพิ่มตัวแปรนี้
        let lessonFinishedToday = [];
        // ดึงข้อมูลรายวิชา
      

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
                        // ดึงข้อมูลและจัดรูปแบบ assignments
                        case 'assignment':
        if (latestSubject && latestSubject.Assignments) {
            // Format assignments data
            const assignmentsData = latestSubject.Assignments.map(assign => ({
                _id: assign._id,
                name: assign.name,
                startDate: moment(assign.StartDate).format('DD/MM/YYYY HH:mm'),
                deadline: moment(assign.Deadline).format('DD/MM/YYYY HH:mm'),
                submissionCount: assign.submitDetail ? assign.submitDetail.length : 0,
                maxScore: assign.Score || 0
            }));

            chartLabels = assignmentsData.map(assign => assign.name);
            chartData = assignmentsData.map(assign => assign.submissionCount);
            lessonLabels = chartLabels;
            progressData = chartData;

            additionalData = {
                totalItems: latestSubject.Assignments.length,
                itemType: 'งานที่มอบหมาย',
                studentAmount: latestSubject.students ? latestSubject.students.length : 0,
                assignmentsData // Add this to pass assignments data to view
            };
        } else {
            additionalData = {
                totalItems: 0,
                itemType: 'งานที่มอบหมาย',
                studentAmount: 0,
                assignmentsData: []
            };
        }
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
        await countTodayAccess(latestSubject._id, contentType) : 
        { todayCount: 0, yesterdayCount: 0, difference: 0, resultMessage: '' };

        // Render dashboard
        res.render('teacherDashboard', {
            navSubjects,
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
            paginateStudents,
            paginateProgress,
            countToday: calculateTodayProgress.todayCount,
            yesterdayCount: calculateTodayProgress.yesterdayCount,
            difference: calculateTodayProgress.difference,
            message: calculateTodayProgress.resultMessage,
            lessonFinishedToday,
            subjectId: subjectId || (latestSubject ? latestSubject._id : null), // เพิ่มบรรทัดนี้
            additionalData: additionalData || {}, // Ensure additionalData is always defined
    ...additionalData
        });

    } catch (err) {
        console.error('Dashboard Error:', err);
        res.render('teacherDashboard', {
            navSubjects,
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
            contentType: req.query.contentType || 'lesson',
            paginateStudents: [],
            paginateProgress: [],
            subjectId: null // เพิ่มบรรทัดนี้
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
    const theme = req.session.theme || 'light'; 
    try {
        // แก้ไขจาก res.render('progressHistory', theme)
        // เป็นการส่ง object ที่มี property theme
        res.render('progressHistory', {
            theme: theme,
            userData: await User.findById(req.session.userId),
            isSidebarOpen: false
        });
    } catch (err) {
        console.error('Progress History Error:', err);
        res.render('progressHistory', {
            theme: 'light',
            userData: null,
            isSidebarOpen: false
        });
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
    try {
        const userData = await User.findById(req.session.userId);
        const theme = req.session.theme || 'light';
        const isSidebarOpen = false;
        
        const studentId = req.query.studentId;
        const subjectId = req.query.subjectId;

        // ตรวจสอบว่ามี studentId และ subjectId หรือไม่
        if (!studentId || !subjectId) {
            return res.status(400).send('Missing required parameters');
        }

        const subjects = await Subject.find({ students: studentId }).sort({ "createdAt": 1 });

        // แก้ไขการค้นหานักศึกษา
        const findStudent = await Student.findOne({ _id: studentId })
            .populate('user')
            .populate({
                path: 'subjects.subjectMongooseId',
                match: { _id: subjectId }
            });

        if (!findStudent) {
            return res.status(404).send('Student not found');
        }

        const subjectHasLessons = await Subject.findById(subjectId).populate("lessonArray");
        if (!subjectHasLessons) {
            return res.status(404).send('Subject not found');
        }

        // ค้นหา lesson progress
        const allLessonProgress = await lessonProgress.find({
            user: findStudent.user._id,
            subjectMongooseId: subjectId
        }).populate("lesson");

        let lessonLabels = [];
        let progressData = [];
        let timeSpent = [];

        // ตรวจสอบและจัดการข้อมูลบทเรียน
        subjectHasLessons.lessonArray.forEach((eachLesson) => {
            const lessonId = eachLesson._id.toString();
            const progress = allLessonProgress.find(p => 
                p.lesson && p.lesson._id.toString() === lessonId
            );

            lessonLabels.push(eachLesson.LessonName);
            if (progress) {
                progressData.push(progress.progress);
                timeSpent.push(progress.timeSpentInSeconds);
            } else {
                progressData.push(0);
                timeSpent.push(0);
            }
        });

        // คำนวณความสำเร็จรวม
        const total = progressData.reduce((acc, curr) => acc + curr, 0);
        const allFinishedProgressLesson = subjectHasLessons.lessonArray.length > 0 
            ? (total / subjectHasLessons.lessonArray.length).toFixed(2)
            : '0.00';

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
        });

    } catch (err) {
        console.error('Student Detail Error:', err);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    adminDashboard,
    progressHistory,
    moreDetailChart,
    studentDetail
}