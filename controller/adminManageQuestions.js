var Quiz = require('../models/quiz')
var User = require('../models/user.model')
const Student = require("../models/student.model");
const Teacher = require("../models/teacher.model")
const fs = require('fs');
const path = require('path');


const mongoose = require('mongoose');



const multer = require('multer');
const upload = multer();

const Grid = require('gridfs-stream');
const { Readable } = require('stream');

const addQuestion = async (req, res) => {
  try {
    const { questionText, options, questionType, answerKey, points, open, quizId } = req.body;

    // ตรวจสอบว่าค่า quizId ถูกส่งมาหรือไม่
    if (!quizId) {
      return res.status(400).json({ success: false, message: 'quizId is required' });
    }

    // ตรวจสอบค่าอื่น ๆ ว่าถูกต้องหรือไม่
    if (!questionText || !Array.isArray(options) || options.length === 0 || !questionType || typeof points !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    const newQuestion = {
      questionText,
      questionType,
      options: options.map(opt => ({ optionText: opt })), // แปลง options ให้เป็น array ของ object
      answerKey,
      points,
      open: open !== undefined ? open : true // ถ้าไม่ได้ระบุค่า open ให้ตั้งเป็น true
    };

    // ค้นหา quiz จาก database
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // เพิ่มคำถามใหม่ลงใน quiz
    quiz.questions.push(newQuestion);
    await quiz.save();

    // ส่ง response กลับไปให้ client
    res.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
      const { quizId, questionId } = req.body;

      if (!quizId || !questionId) {
          return res.status(400).json({ success: false, message: 'quizId and questionId are required' });
      }

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
          return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      const questionIndex = quiz.questions.findIndex(q => q._id.toString() === questionId);

      if (questionIndex === -1) {
          return res.status(404).json({ success: false, message: 'Question not found' });
      }

      quiz.questions.splice(questionIndex, 1);
      await quiz.save();

      res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



const getQuestions = async (req, res) => {
  const { quizId } = req.query;

  try {
      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
          return res.status(404).json({ success: false, message: 'Quiz not found' });
      }

      res.json({ success: true, questions: quiz.questions });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};








module.exports = {
  addQuestion,
  deleteQuestion,
  getQuestions
  
}
