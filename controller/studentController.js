var User = require('../models/user.model')
var Student = require('../models/student.model')
const Lesson = require("../models/Lessons");
const Subject = require("../models/subjects");
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
        // console.log(getUserLessons);

        // res.json(userData);
        res.render("studentIndex", { getUserLessons });
    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาด");
    }
}

const studentLesson = async (req, res) => {
    try {
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
        res.render("studentLessons", { userData });
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
        // console.log(subjectId);
        const findUser = await User.findById(req.session.userId).populate("student");
        const filterSubject = findUser.student.subjects.filter(subject => subject.subjectMongooseId == subjectId);

        // res.json(filterSubject);

        // res.json(findStudent);

        // const studentUser = findStudent.user;
        // const studentSubmitAssign = findStudent.user.submitAssign;
        const totalScore = filterSubject[0].weeks.reduce((total, week) => total + week.scorePerWeek, 0);

        res.render("subjectDatail", { totalScore, filterSubject, findUser,subjectId });
    } catch (error) {
        console.log(error);
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
module.exports = {
    studentIndex,
    studentLesson,
    studentAssignment,
    subjectDetail,
    studentEditScorePerweek
}