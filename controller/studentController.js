var User = require('../models/user.model')
var Student = require('../models/student.model')
const Lesson = require("../models/Lessons");
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
module.exports = {
    studentIndex,
    studentLesson,
    studentAssignment
}