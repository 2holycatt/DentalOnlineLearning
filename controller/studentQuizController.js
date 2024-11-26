var Quiz = require('../models/quiz')
var User = require('../models/user.model')
const Student = require("../models/student.model");
const Teacher = require("../models/teacher.model")
const SchoolYear = require("../models/schoolYear");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer();
const passport = require('passport');
const mongoose = require('mongoose');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
const Grid = require('gridfs-stream');
const { Readable } = require('stream');

exports.submitQuiz = async (req, res) => {
    try {
        console.log("Body received in backend:", req.body);  // ตรวจสอบข้อมูลที่ส่งมาใน backend

        const quizId = req.body.quizId;  // ดึงค่า quizId จาก body
        const answers = req.body.answers;  // ดึงคำตอบจาก body

        console.log("Quiz id =", quizId);

        // ตรวจสอบว่ามี quizId และ quiz นั้นๆ มีอยู่หรือไม่
        if (!quizId) {
            return res.status(400).json({ success: false, message: 'Quiz ID ไม่ถูกต้อง' });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'ไม่พบแบบทดสอบนี้' });
        }

        const userData = await User.findById(req.session.userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
        }

        const userRole = userData.role;

        // ประมวลผลคำตอบและคำนวณคะแนน
        let totalScore = 0;
        quiz.questions.forEach((question, index) => {
            if (answers[index] === question.answer) {
                totalScore += question.points;
            }
        });

        // บันทึกคะแนนใน attempts ของ quiz
        const attempt = {
            studentId: req.session.userId,
            score: totalScore,
            attemptCount: (quiz.attempts.find(attempt => attempt.studentId.toString() === req.session.userId)?.attemptCount || 0) + 1,
            date: new Date(),
        };

        // เพิ่มการพยายามใหม่ลงใน attempts ของ quiz
        quiz.attempts.push(attempt);
        await quiz.save();

        // ส่งข้อมูลผลลัพธ์กลับ
        res.status(200).json({ success: true, score: totalScore });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
};

  



// exports.sendQuizAnswers = async (req, res) => {
//     const quizId = req.body.quizId;
//     const answers = req.body.answers; // รับคำตอบจาก body ของ request

//     if (!quizId || !answers) {
//         return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วนในการส่งคำตอบ' });
//     }

//     try {
//         // ค้นหา quiz โดยใช้ quizId
//         const quiz = await Quiz.findById(quizId);
//         if (!quiz) {
//             return res.status(404).json({ success: false, message: 'ไม่พบแบบทดสอบ' });
//         }

//         // หา user ID จาก session (ผู้ใช้ที่เข้าสู่ระบบ)
//         const studentId = req.session.userId; // ใช้ค่า session ของผู้ใช้ที่ล็อกอินอยู่

//         // หา student จาก model
//         const student = await Student.findOne({ user: studentId });
//         if (!student) {
//             return res.status(404).json({ success: false, message: 'ไม่พบนักเรียน' });
//         }

//         // หา attempt ของนักเรียนที่เคยทำแบบทดสอบนี้มาก่อน
//         let studentAttempt = student.attempts.find(attempt => attempt.quizId.toString() === quizId);
        
//         if (studentAttempt) {
//             // ตรวจสอบว่า attempt เกิน attemptLimit หรือไม่
//             if (studentAttempt.attemptCount >= quiz.attemptLimit) {
//                 return res.status(400).json({ success: false, message: 'คุณทำแบบทดสอบครบจำนวนครั้งที่กำหนดแล้ว' });
//             }
//             studentAttempt.attemptCount += 1; // เพิ่มจำนวนครั้งในการทำแบบทดสอบ
//         } else {
//             // ถ้ายังไม่มีการทำแบบทดสอบให้สร้าง attempt ใหม่
//             studentAttempt = { quizId: quiz._id, attemptCount: 1, score: 0 };
//             student.attempts.push(studentAttempt);
//         }

//         // คำนวณคะแนนจากคำตอบ
//         let totalScore = 0;
//         quiz.questions.forEach((question, i) => {
//             const studentAnswer = answers[i];
//             if (question.answerKey === studentAnswer) {
//                 totalScore += question.points;
//             }
//         });

//         // อัปเดตคะแนนใน attempt ของนักเรียน
//         studentAttempt.score = totalScore;

//         // บันทึกข้อมูลลงในฐานข้อมูล
//         await student.save();

//         // ส่งผลลัพธ์กลับไปยัง client
//         res.json({ success: true, message: 'ส่งแบบทดสอบสำเร็จ', score: totalScore });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งแบบทดสอบ' });
//     }
// };




