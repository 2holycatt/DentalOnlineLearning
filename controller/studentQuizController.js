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
const Subject = require("../models/subjects");


exports.submitQuiz = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const userId = req.session.userId;

        // หาข้อมูลนักศึกษาและ populate ข้อมูลที่จำเป็น
        const student = await Student.findOne({ user: userId })
            .populate('user')
            .populate('subjects.subjectMongooseId');
            
        if (!student) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
        }

        console.log('Student data:', {
            id: student._id,
            name: `${student.fname} ${student.lname}`,
            studentId: student.studentId
        });
        // หาแบบทดสอบ
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'ไม่พบแบบทดสอบ' });
        }

        // คำนวณคะแนนและเตรียมคำตอบ
        let totalScore = 0;
        const attemptAnswers = [];

        Object.keys(answers).forEach(questionId => {
            const question = quiz.questions.id(questionId);
            if (!question) return;

            let isCorrect = false;
            let points = 0;

            if (question.questionType === 'MCQ') {
                isCorrect = answers[questionId] === question.answer;
                points = isCorrect ? question.points : 0;
            }

            totalScore += points;
            attemptAnswers.push({
                questionId,
                answer: answers[questionId],
                isCorrect,
                points
            });
        });

        // Initialize attempts array if undefined
        if (!quiz.attempts) {
            quiz.attempts = [];
        }

        const existingAttempt = quiz.attempts.find(a => 
            a?.studentDbId?.toString() === student._id.toString()
        );

   // Update quiz attempts first
   if (existingAttempt) {
    // Update existing attempt
    existingAttempt.eachAttempt.push({
        answers: attemptAnswers,
        score: totalScore,
        attemptNumber: existingAttempt.eachAttempt.length + 1,
        submittedAt: new Date()
    });
} else  {
    // Create new attempt with required fields
    const newAttempt = {
        studentDbId: student._id,
        studentId: student.studentId || '',
        studentName: student.fname + ' ' + student.lname,  // เพิ่มบรรทัดนี้
        eachAttempt: [{
            answers: attemptAnswers,
            score: totalScore,
            attemptNumber: 1,
            submittedAt: new Date()
        }]
    };
    console.log('New attempt data:', newAttempt);
    quiz.attempts.push(newAttempt);
}

await quiz.save();


// Update student model using findOneAndUpdate
await Student.findOneAndUpdate(
    { 
        _id: student._id,
        'subjects.subjectMongooseId': quiz.subject.subjectMongooseId 
    },
    {
        $push: {
            'subjects.$.quizAttempts': {
                quizId: quiz._id,
                eachAttempt: [{
                    answers: attemptAnswers,
                    score: totalScore,
                    attemptNumber: existingAttempt ? 
                        existingAttempt.eachAttempt.length + 1 : 1,
                    submittedAt: new Date()
                }]
            }
        }
    },
    { new: true, runValidators: false }
);

    return res.status(200).json({
        success: true,
        score: totalScore,
        message: 'ส่งแบบทดสอบสำเร็จ'
    });

} catch (error) {
    console.error('Quiz submission error:', error);
    return res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการส่งแบบทดสอบ'
    });
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




