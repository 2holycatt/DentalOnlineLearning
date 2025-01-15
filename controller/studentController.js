var User = require('../models/user.model')
var Student = require('../models/student.model')
const Lesson = require("../models/Lessons");
const Subject = require("../models/subjects");
const Quiz = require("../models/quiz");
const moment = require('moment');

const studentIndex = async (req, res) => {
    try {
        const userData = await User.findById(req.session.userId)
            .populate({
                path: "student",
                populate: {
                    path: "subjects.subjectMongooseId",
                }
            });
        const getUserLessons = userData
        const theme = req.session.theme || 'light';
        const isSidebarOpen = false;

        // console.log(getUserLessons);

        // res.json(userData);
        res.render("studentIndex", { getUserLessons, userData, theme, isSidebarOpen });
    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาด");
    }
}

const studentLesson = async (req, res) => {
    try {
        const originPage = req.query.originPage;
        const subject = await Subject.find().sort({ semester: 1 }).populate("lessonArray");
        const theme = req.session.theme || 'light';
        const isSidebarOpen = false;
        const findSubject = null;

        const userData = await User.findById(req.session.userId)
            .populate({
                path: "student",
                populate: {
                    path: "subjects.subjectMongooseId",
                    populate: {
                        path: "lessonArray"
                    }
                }
            });
        // const getUserLessons = userData.student.schoolYear.lessonArray;
        res.render("studentLessons", { userData, theme, isSidebarOpen, subject, findSubject, originPage });
        // res.json(userData);
    } catch (error) {
        console.error(error);
    }
}

const studentAssignment = async (req, res) => {
    try {
        const userData = await User.findById(req.session.userId)
            .populate({
                path: "student",
                populate: {
                    path: "subjects.subjectMongooseId",
                    populate: {
                        path: "Assignments"
                    }
                }
            });
        // res.json(userData);
        const subjects = userData.student.subjects;
        // const subjects = getSubjects.subjectMongooseId;
        // res.json(getSubjects)

        subjects.forEach(subject => {
            const getInSub = subject.subjectMongooseId;
            getInSub.Assignments.forEach(assignment => {
                assignment._doc.formattedStartDate = moment(assignment.StartDate).format('DD/MM/YYYY hh:mm A');
                assignment._doc.formattedDeadline = moment(assignment.Deadline).format('DD/MM/YYYY hh:mm A');
            })
        });
        // // const getUserLessons = userData.student.schoolYear.lessonArray;
        res.render("studentAssignment", { userData, subjects });
        // res.json(subjects);
    } catch (error) {
        console.error(error);
    }
}

const subjectDetail = async (req, res) => {
    try {
        const subjectId = req.query.subjectDbId;
        const studentData = await Student.findOne({ user: req.session.userId }).populate('subjects.subjectMongooseId');

        if (!studentData || !studentData.subjects) {
            return res.status(404).send("Student or subjects not found");
        }

        const filterSubject = studentData.subjects.filter(subject => subject.subjectMongooseId._id.toString() === subjectId);

        if (filterSubject.length === 0) {
            return res.status(404).send("Subject not found");
        }

        const totalScore = filterSubject[0].weeks.reduce((total, week) => total + week.scorePerWeek, 0);

        res.render("subjectDetail", { totalScore, filterSubject, studentData, subjectId });
    } catch (error) {
        console.log(error);
        res.status(500).send("เกิดข้อผิดพลาด");
    }
}

const studentEditScorePerweek = async (req, res) => {
    try {
        const formData = req.body;
        const { studentId, subjectId } = req.body;
        const student = await Student.findById(studentId);
        // res.json(student);
        // ค้นหาวิชาใน subjects array ตาม subjectId
        // const subject = student.subjects.find(sub => sub.subjectMongooseId === subjectId);
        const subject = student.subjects.find(sub => sub.subjectMongooseId.toString() == subjectId);
        // res.json(subject);
        // if (!subject) {
        //   return res.status(404).send('Subject not found');
        // }

        // อัปเดตคะแนน scorePerWeek ตามข้อมูลที่ได้จาก formData
        subject.weeks.forEach((week, index) => {
            const scoreKey = `editScorePerweek${index}`;
            if (formData[scoreKey] !== undefined) {
                week.scorePerWeek = parseInt(formData[scoreKey], 10);
            }
        });

        // // บันทึกการเปลี่ยนแปลงใน database
        await student.save();
        // res.json(formData);
        res.redirect(`/subjectDetail?subjectDbId=${subjectId}`);


    } catch (err) {
        console.log(err);
    }
}

const studentExam = async (req, res) => {
    try {
        const userData = await User.findById(req.session.userId)
        .populate({
            path: "student",
            populate: {
                path: "subjects.subjectMongooseId",
                populate: {
                    path: "Quiz"
                }
            }
        });
        // const subjects = userData.student.subjects;

            const quiz = await Quiz.find({ isReleased: true }).populate('subject').sort({ releaseDate: 1 });
            const theme = req.session.theme || 'light'; 
            // const getUserLessons = userData.student.schoolYear.lessonArray;
            const findYear = null;
            const isSidebarOpen = false;
            // const subject = student.subjects.find(sub => sub.subjectMongooseId.toString() == subjectId);
        // const getUserLessons = userData.student.schoolYear.lessonArray;
        res.render("studentExam", { userData, quiz ,theme, isSidebarOpen });
    } catch (error) {
        console.error(error);
    }
}

const eachQuizStudent = async(req, res) => {
    try {
        const userData = await User.findById(req.session.userId)
            .populate({
                path: "student",
                populate: {
                    path: "subjects.subjectMongooseId",
                    populate : {
                        path: "Quiz"
                    }
                }
            });
            // const subjects = userData.student.subjects;
            // const subject = student.subjects.find(sub => sub.subjectMongooseId.toString() == subjectId);
            const quiz = await Quiz.find().sort({ createdAt: 1 }).populate("schoolYear");
            const theme = req.session.theme || 'light'; 
            const isSidebarOpen = false;
        // const getUserLessons = userData.student.schoolYear.lessonArray;
        res.render("eachQuizStudent", { userData, quiz ,theme, isSidebarOpen });
    } catch (error) {
        console.error(error);
    }
}
module.exports = {
    studentIndex,
    studentLesson,
    studentAssignment,
    subjectDetail,
    studentEditScorePerweek,
    studentExam,
    eachQuizStudent
}