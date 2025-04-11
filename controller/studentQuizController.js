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

exports.startQuiz = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const student = await Student.findOne({ user: req.session.userId });
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
        }
        
        // Find the quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'ไม่พบแบบทดสอบ' });
        }
        
        // Check if quiz is released
        const now = new Date();
        if (!quiz.isReleased) {
            return res.status(403).json({ success: false, message: 'แบบทดสอบยังไม่ได้รับการเผยแพร่' });
        }
        
        // Check deadline if exists
        if (quiz.deadline && now > new Date(quiz.deadline)) {
            return res.status(403).json({ success: false, message: 'เลยกำหนดส่งแบบทดสอบแล้ว' });
        }
        
        // Check for existing attempt
        let studentAttempt = quiz.attempts.find(a => 
            a?.studentDbId?.toString() === student._id.toString()
        );
        
        // Check for incomplete attempts first
        let incompleteAttempt = null;
        if (studentAttempt && studentAttempt.eachAttempt && studentAttempt.eachAttempt.length > 0) {
            incompleteAttempt = studentAttempt.eachAttempt.find(a => a.status === 'incomplete');
        }
        
        if (incompleteAttempt) {
            // Return the existing incomplete attempt
            return res.status(200).json({ 
                success: true, 
                message: 'กำลังกลับไปที่แบบทดสอบที่ยังทำไม่เสร็จ',
                attemptId: incompleteAttempt._id,
                isContinuing: true
            });
        }
        
         // Count completed attempts
         const completedAttempts = studentAttempt?.eachAttempt?.filter(a => a.status === 'completed') || [];
         const completedCount = completedAttempts.length;

           // Check attempt limit - แก้ไขส่วนนี้
        if (completedCount >= quiz.attemptLimit) {
            return res.status(403).json({ 
                success: false, 
                message: `คุณได้ทำแบบทดสอบครบตามจำนวนครั้งที่กำหนด (${quiz.attemptLimit} ครั้ง) แล้ว` 
            });
        }
        
        // Check attempt limit if no incomplete attempt
        if (studentAttempt && studentAttempt.eachAttempt) {
            // Count only completed attempts
            const completedAttempts = studentAttempt.eachAttempt.filter(a => a.status === 'completed');
            
            if (completedAttempts.length >= quiz.attemptLimit) {
                return res.status(403).json({ success: false, message: 'คุณได้ทำแบบทดสอบครบตามจำนวนครั้งที่กำหนดแล้ว' });
            }
        }
        
         // Create new attempt
        const attemptNumber = studentAttempt ? 
            (completedCount + 1) : 1;
        
        const startTime = new Date();
        
        // Initialize the new attempt
        const newAttemptData = {
            startedAt: startTime,
            submittedAt: null,
            attemptNumber: attemptNumber,
            answers: [],
            totalScore: 0,
            status: 'incomplete'
        };
        
        // Add attempt to the quiz
        if (studentAttempt) {
            // Add to existing student attempt
            studentAttempt.eachAttempt.push(newAttemptData);
        } else {
            // Create new student attempt record
            quiz.attempts.push({
                studentDbId: student._id,
                studentId: student.studentId || '',
                studentName: student.user.fname + ' ' + student.user.lname,
                studentNickname: student.nickname || '',
                eachAttempt: [newAttemptData]
            });
        }
        
        await quiz.save();
        
        // Get the attempt ID for tracking
        const updatedStudentAttempt = quiz.attempts.find(a => 
            a?.studentDbId?.toString() === student._id.toString()
        );
        const attemptId = updatedStudentAttempt.eachAttempt[updatedStudentAttempt.eachAttempt.length - 1]._id;
        
        return res.status(200).json({ 
            success: true, 
            message: 'เริ่มทำแบบทดสอบเรียบร้อยแล้ว',
            attemptId: attemptId
        });
        
    } catch (error) {
        console.error('Error starting quiz attempt:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเริ่มทำแบบทดสอบ' });
    }
};



exports.submitQuiz = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const { answers = [], duration, attemptId, status } = req.body;
        
        console.log('Received answers:', answers);
        
        // Check student
        const student = await Student.findOne({ user: req.session.userId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลนักศึกษา' });
        }
        
        // Find quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'ไม่พบแบบทดสอบ' });
        }
        
        // Find the specific attempt that was started
        const studentAttempt = quiz.attempts.find(a => 
            a?.studentDbId?.toString() === student._id.toString()
        );
        
        if (!studentAttempt) {
            return res.status(404).json({ success: false, message: 'ไม่พบการทำแบบทดสอบของนักศึกษา' });
        }
        
        // Find the specific eachAttempt by attemptId
        let currentAttempt;
        if (attemptId) {
            currentAttempt = studentAttempt.eachAttempt.find(a => 
                a._id.toString() === attemptId
            );
        }
        
        // If no specific attempt found, use the latest incomplete attempt
        if (!currentAttempt) {
            currentAttempt = studentAttempt.eachAttempt.find(a => a.status === 'incomplete');
            if (!currentAttempt) {
                return res.status(404).json({ success: false, message: 'ไม่พบการทำแบบทดสอบที่ยังไม่เสร็จ' });
            }
        }
        
        // Calculate scores and process answers
        let totalScore = 0;
        const attemptAnswers = [];
        
        // Map questions by _id for easier lookup
        const questionsById = {};
        quiz.questions.forEach((q, index) => {
            questionsById[q._id.toString()] = {
                question: q,
                index: index
            };
        });
        
        console.log('Mapped questions:', Object.keys(questionsById));
        
        // Process each submitted answer
        for (const answer of answers) {
            console.log('Processing answer:', answer);
            
            const questionInfo = questionsById[answer.questionId];
            if (!questionInfo) {
                console.log('Question not found for ID:', answer.questionId);
                continue;
            }
            
            const question = questionInfo.question;
            const questionIndex = questionInfo.index;
            let isCorrect = false;
            let points = 0;
            
            console.log('Question found:', question.questionText);
            
            // Calculate score based on question type
            switch (answer.type) {
                case 'MCQ':
                    console.log('Checking MCQ answer:', answer.answer, 'vs', question.answer);
                    
                    // ตรวจสอบทั้ง answer และ answerKey
                    const selectedIndex = answer.answer;
                    const correctAnswer = question.answer !== undefined ? question.answer : question.answerKey;
                    
                    console.log('Selected index:', selectedIndex);
                    console.log('Correct answer value:', correctAnswer);
                    
                    // ลองเปรียบเทียบโดยแปลงเป็น String เพื่อให้แน่ใจว่าการเปรียบเทียบถูกต้อง
                    if (selectedIndex !== undefined && 
                        (selectedIndex.toString() === correctAnswer?.toString() || 
                         selectedIndex === parseInt(correctAnswer))) {
                        isCorrect = true;
                        points = question.points || 0;
                        console.log('Correct MCQ answer! Points:', points);
                    } else {
                        console.log('Incorrect answer. Answer type:', typeof selectedIndex, 
                                   'correctAnswer type:', typeof correctAnswer);
                    }
                    break;
                
                case 'checkbox':
                    // For checkbox, compare arrays of selected options with answer
                    if (Array.isArray(answer.answer) && Array.isArray(question.answer)) {
                        console.log('Checking checkbox answer:', answer.answer, 'vs', question.answer);
                        // ตรวจสอบว่าเลือกตรงกับคำตอบที่ถูกต้องหรือไม่
                        const correctAnswers = new Set(question.answer.map(a => a.toString()));
                        const selectedAnswers = new Set(answer.answer.map(a => a.toString()));
                        
                        // คำนวณคะแนน - จำนวนข้อที่ถูกต้อง
                        let correctCount = 0;
                        let incorrectCount = 0;
                        
                        selectedAnswers.forEach(selected => {
                            if (correctAnswers.has(selected)) {
                                correctCount++;
                            } else {
                                incorrectCount++;
                            }
                        });
                        
                        if (correctCount === correctAnswers.size && incorrectCount === 0) {
                            isCorrect = true;
                            points = question.points || 0;
                            console.log('Correct checkbox answer! Points:', points);
                        } else if (correctCount > 0) {
                            // คะแนนบางส่วน
                            points = Math.max(0, ((question.points || 0) * correctCount) / correctAnswers.size);
                            console.log('Partially correct checkbox! Points:', points);
                        }
                    }
                    break;
                
                // กรณีอื่นๆ...
                case 'matching':
                    // สำหรับ matching questions
                    if (Array.isArray(answer.answer)) {
                        console.log('Checking matching answer:', answer.answer);
                        
                        let totalMatchPoints = 0;
                        const matchingResults = [];
                        
                        // ตรวจสอบแต่ละการจับคู่
                        answer.answer.forEach(match => {
                            const { leftIndex, rightIndex } = match;
                            
                            const correctMatch = question.matchingPairs?.find(p => 
                                p.left.index === leftIndex && 
                                p.right.index === rightIndex
                            );
                            
                            const isMatchCorrect = !!correctMatch;
                            const matchPoints = isMatchCorrect ? (correctMatch.points || 1) : 0;
                            
                            totalMatchPoints += matchPoints;
                            
                            matchingResults.push({
                                leftIndex,
                                rightIndex,
                                isCorrect: isMatchCorrect,
                                pointsEarned: matchPoints
                            });
                            
                            console.log('Match result:', isMatchCorrect, 'Points:', matchPoints);
                        });
                        
                        // คะแนนสูงสุดไม่เกินคะแนนเต็มของข้อนี้
                        points = Math.min(totalMatchPoints, question.points || 0);
                        isCorrect = points > 0;
                        
                        attemptAnswers.push({
                            questionId: answer.questionId,
                            answer: answer.answer,
                            type: answer.type,
                            isCorrect,
                            points,
                            matchingAnswers: matchingResults
                        });
                        
                        totalScore += points;
                        continue; // ข้ามการเพิ่ม answer อีกครั้ง
                    }
                    break;
                    
                case 'short_answ':
                    // For short answers, check against possible correct answers
                    if (question.answerTexts && question.answerTexts.length > 0) {
                        console.log('Checking short answer:', answer.answer, 'vs', question.answerTexts);
                        const normalizedUserAnswer = answer.answer.trim().toLowerCase();
                        
                        // ตรวจสอบว่าตรงกับคำตอบที่ถูกต้องหรือไม่
                        const isMatch = question.answerTexts.some(correctAnswer => 
                            correctAnswer.trim().toLowerCase() === normalizedUserAnswer
                        );
                        
                        if (isMatch) {
                            isCorrect = true;
                            points = question.points || 0;
                            console.log('Correct short answer! Points:', points);
                        }
                    }
                    break;
                
                case 'Paragraph':
                    // For paragraph questions - อาจารย์ต้องตรวจเอง
                    points = 0;
                    break;
            }
            
            // เพิ่มคำตอบเข้าไปในอาร์เรย์
            if (answer.type !== 'matching') { // matching จัดการแล้วในด้านบน
                attemptAnswers.push({
                    questionId: answer.questionId,
                    answer: answer.answer,
                    type: answer.type,
                    isCorrect,
                    points
                });
                
                totalScore += points;
            }
        }
        
        console.log('Total score:', totalScore);
        console.log('Processed answers:', attemptAnswers);
        
        // อัปเดตข้อมูลการทดสอบ
        currentAttempt.answers = attemptAnswers;
        currentAttempt.totalScore = totalScore;
        currentAttempt.submittedAt = new Date();
        currentAttempt.duration = duration || 0;
        currentAttempt.status = 'completed'; // แก้สถานะเป็น completed
        
        await quiz.save();
        
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




