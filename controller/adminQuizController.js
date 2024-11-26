var Quiz = require('../models/quiz')
const Lesson = require("../models/Lessons");
var User = require('../models/user.model')
const Student = require("../models/student.model");
const Teacher = require("../models/teacher.model")
const SchoolYear = require("../models/schoolYear");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer();
const moment = require('moment-timezone');
const passport = require('passport');
const mongoose = require('mongoose');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
const Grid = require('gridfs-stream');
const { Readable } = require('stream');
const schedule = require('node-schedule');
const cron = require('node-cron');


// const Notification = require("../models/notification");
// const { createNotification } = require('./notificationController');
// const { sendEmail } = require('../service/notification');


exports.createQuiz = async (req, res, next) => {
  try {
    const userData = await User.findById(req.session.userId);
    const schoolYear = req.body.schoolYear;
    const checkExists = await SchoolYear.findOne({ schoolYear });
    const users = await User.find();
    const subject = "แบบทดสอบใหม่จาก Online Dentistry Learning";
    const whoemail = req.session.email;
    const name = req.body.quizname;

    const description = req.body.quizdescription;
    const timeLimit = JSON.parse(req.body.timeLimit);
    const attemptLimit = req.body.attemptLimit;


    const questions = [
      {
        questionText: 'คำถามไม่ระบุชื่อ',
        options: [{ optionText: 'ตัวเลือก 1' }],
        questionType: 'MCQ',
        answer: false,
        answerKey: "",
        points: 1,
        open: true
      }
    ];
    // สร้าง Quiz
    const quizData = {
      owneremail: whoemail,
      quizname: name,
      quizdescription: description,
      timeLimit: {
        value: timeLimit.value,
        display: timeLimit.display
      },
      attemptLimit: attemptLimit,
      upload: req.file ? true : false,
      schoolYear: checkExists ? checkExists._id : null,
      questions: questions // เพิ่มคำถามใน Quiz
    };

    // ถ้ามีการอัปโหลดไฟล์
    if (req.file) {
      quizData.quizImage = {
        data: req.file.path,
        contentType: req.file.mimetype
      };
    }

    // สร้าง Quiz
    let quizCreate;
    if (checkExists) {
      quizCreate = new Quiz(quizData);
      await quizCreate.save();

      // อัปเดต SchoolYear ด้วย Quiz ใหม่
      await SchoolYear.findByIdAndUpdate(
        checkExists._id,
        { $push: { quizArray: quizCreate._id } },
        { new: true }
      );
    } else {
      const createSchoolYear = new SchoolYear({ schoolYear });
      await createSchoolYear.save();
      quizData.schoolYear = createSchoolYear._id;
      quizCreate = new Quiz(quizData);
      await quizCreate.save();

      // อัปเดต SchoolYear ใหม่
      await SchoolYear.findByIdAndUpdate(
        createSchoolYear._id,
        { $push: { quizArray: quizCreate._id } },
        { new: true }
      );
    }

    // เปลี่ยนเส้นทางไปยังหน้า eachQuiz ที่สร้างใหม่
    res.redirect(`/adminIndex/eachQuiz?quizId=${quizCreate._id}`);

  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};






exports.getUploadquiz = (req, res) => {
  Quiz.find({ owner: req.userId, upload: false }, (err, qz) => {
    if (err) {
      console.log(error);
      res.json({ msg: "some error!" });
    }
    else {
      res.json({ quiz: qz });
    }
  })
}

exports.seeStudent = (req, res) => {
  User.find({ role: "student" }, (err, usr) => {
    if (err) {
      console.log(error);
      res.json({ msg: "some error!" });
    }
    else {
      res.json({ user: usr });
    }
  })
}

// exports.createQuestion_1 = (req, res) => {

//     Question.find({ quizid: req.body.quizid }, (err, q) => {
//         if (err) {
//             console.log(error);
//             res.json({ msg: "some error!" });
//         }
//         else {
//             var question1 = new question1({
//                 quizid: req.body.quizid,
//                 questionId: q.length + 1,
//                 questionText: req.body.questionText,
//                 questionImage: req.body.questionImage,
//                 answer: req.body.answer,
//                 options: req.body.options
//             });

//             question1.save((error, qsn) => {
//                 if (error) {
//                     console.log(error);
//                     res.json({ msg: "some error!" });
//                 }
//                 else {
//                     res.status(200).json({ message: "yes question added!!" })
//                 }
//             })
//         }
//     })
// }

exports.uploadQuiz = (req, res) => {
  console.log("upload back");
  console.log(req.body);
  Question.find({ quizid: req.body.id }, (err, qz) => {
    if (err) {
      console.log(error);
      res.json({ msg: "some error!" });
    }
    else {
      console.log(qz.length);
      if (qz.length < 5) {
        res.json({ msg: "You must have 5 question in the quiz for upload quiz!!" });
      }
      else {
        Quiz.updateOne({ _id: req.body.id }, { upload: true }, function (err, user) {
          if (err) {
            console.log(err)
            res.json({ msg: "something went wrong!!" })
          }
          else {
            const io = req.app.get('io');
            io.emit("quizcrud", "Quiz Crud done here");
            res.json({ message: "quiz uploaded!" });
          }
        })

      }

    }
  })

}




exports.getHomequiz = (req, res) => {
  Quiz.find({ owner: req.userId, upload: true }, (err, qz) => {
    if (err) {
      console.log(error);
      res.json({ msg: "some error!" });
    }
    else {
      res.json({ quiz: qz });
    }
  })
}

exports.getAllQuestion = (req, res) => {
  // const url = `http://localhost:4200/teacher/seequestion`
  Question.find({ quizid: req.params.id }, (err, qz) => {
    if (err) {
      console.log(error);
      res.json({ errormsg: "some error!" });
    }
    else {
      res.json({ msg: qz });
    }
  })
  res.redirect(
    'adminExam')
}




exports.adminExamsIndex = async (req, res) => {
  try {
    const userData = await User.findById(req.session.userId);
    const quiz = await Quiz.find().sort({ createdAt: 1 }).populate("schoolYear");
    const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });
    const findYear = null;
    const theme = req.session.theme || 'light';
    const isSidebarOpen = false;
    res.render("adminExam", { mytitle: "adminExam", userData, quiz, schoolYears, findYear, theme, isSidebarOpen }); // ถ้าไฟล์อยู่ในโฟลเดอร์ views
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}
// เพิ่มการแสดงหน้าสร้างแบบทดสอบ
exports.addQuizPage = async (req, res) => {
  // if (req.user) {
  try {
    const userData = await User.findById(req.session.userId);
    const schoolYearId = req.query.schoolYearId;
    const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });
    const theme = req.session.theme || 'light';
    const isSidebarOpen = false;

    const quiz = await Quiz.find().sort({ createdAt: 1 }).exec();
    res.render("addQuiz", { mytitle: "addQuiz", quiz, userData, schoolYearId, schoolYears, theme, isSidebarOpen }); // เปลี่ยนชื่อหน้าตามที่คุณต้องการ
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}
//   else {
//     res.redirect('/login');
//   }
// }

exports.eachQuiz = async (req, res) => {
  try {
    let quizId = req.query.quizId;
    // ตรวจสอบว่ามี '/edit' หรือไม่
    const isEditPage = quizId.includes('/edit');
    if (isEditPage) {
      quizId = quizId.split('/edit')[0]; // แยก '/edit' ออก
    }

    const isTestPage = quizId.includes('/test');
    if (isTestPage) {
      quizId = quizId.split('/test')[0]; // แยก '/edit' ออก
    }

    const isResultPage = quizId.includes('/result');
    if (isResultPage) {
      quizId = quizId.split('/result')[0]; // แยก '/edit' ออก
    }

    const isViewPage = quizId.includes('/preview');
    if (isViewPage) {
      quizId = quizId.split('/preview')[0]; // แยก '/preview' ออก
    }

    const isResultDetailPage = quizId.includes('/rdetail');
    if (isResultDetailPage) {
      quizId = quizId.split('/rdetail')[0]; // แยก '/resultDetail' ออก
    }

    const isResponsePage = quizId.includes('/response');
    if (isResponsePage) {
      quizId = quizId.split('/response')[0]; // แยก '/response' ออก
    }


    const quiz = await Quiz.findById(quizId).populate("schoolYear");
    if (!quiz) {
      return res.status(404).send('Quiz not found');
    }
    if (isEditPage && req.xhr) { // เช็คว่าเป็นการร้องขอผ่าน AJAX หรือไม่
      return res.json({ success: true, questions: quiz.questions });
    }


    const userData = await User.findById(req.session.userId);
    const quizzes = await Quiz.find().sort({ createdAt: 1 }).exec();
    const schYear = quiz.schoolYear.schoolYear;
    const questions = quiz.questions;
    const options = quiz.questions.options;
    const releaseWhenLocal = quiz.releaseWhen ? moment.utc(quiz.releaseWhen).format('DD/MM/YYYY, เวลา HH:mm') : null;
    const deadlineLocal = quiz.deadline ? moment.utc(quiz.deadline).format('DD/MM/YYYY, เวลา HH:mm') : null;

    const timeLimitMilliseconds = quiz.timeLimit.value * 1000; // แปลงเป็น milliseconds
    const timeLimitFormatted = formatTime(timeLimitMilliseconds);

    function formatTime(milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    console.log("Release When (local):", releaseWhenLocal);
    console.log("Deadline (local):", deadlineLocal);

    const theme = req.session.theme || 'light';
    const isSidebarOpen = false;

    const userRole = userData.role; // ดึงบทบาทจาก userData เช่น 'student' หรือ 'teacher'
    const totalPoints = quiz.questions.reduce((total, question) => total + question.points, 0);

    let studentScore = 0;
    let attemptCount = 0;

    if (userRole === 'student' && isResultPage) {
      const studentAttempt = quiz.attempts.find(attempt => attempt.studentId.toString() === req.session.userId);
      if (studentAttempt) {
        studentScore = studentAttempt.score; // สมมุติว่ามีการเก็บคะแนนในฟิลด์นี้
        attemptCount = studentAttempt.attemptCount;
      }
    }

    // จัดเรียง foundQuestions ตามวันที่สร้าง
    // questions.sort((a, b) => {
    //     const dateA = new Date(a.createdAt);
    //     const dateB = new Date(b.createdAt);
    //     return dateA - dateB;
    // });
    if (userRole === 'teacher') {
      // Render หน้าแต่ละหน้า
      if (isEditPage) {
        res.render("editEachQuiz", {
          mytitle: "editEachQuiz",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          theme,
          isSidebarOpen

        });
      } else if (isViewPage) {
        res.render("quiz_preview_test", {
          mytitle: "viewEachQuiz",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          timeLimitMilliseconds,
          timeLimitFormatted,
          theme,
          isSidebarOpen
        });
      } else if (isResponsePage) {
        res.render("quiz_response", {
          mytitle: "responseEachQuiz",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          timeLimitMilliseconds,
          timeLimitFormatted,
          totalPoints,
          studentScore,
          attemptCount,
          percentage: (studentScore / totalPoints) * 100,
          theme,
          isSidebarOpen
        });
      } else if (isResultDetailPage) { // เพิ่มเงื่อนไขสำหรับ render หน้า rdetail
        res.render("quiz_resultDetailResponse", {
          mytitle: "Quiz Result Detail Response",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          timeLimitMilliseconds,
          timeLimitFormatted,
          totalPoints,
          studentScore,
          attemptCount,
          percentage: (studentScore / totalPoints) * 100,
          theme,
          isSidebarOpen
        });
      } else {
        res.render("eachQuiz", {
          mytitle: "eachQuiz",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          theme,
          isSidebarOpen
        });
      }
    } else if (userRole === 'student') {
      if (isTestPage) {
        res.render("quiz_test", {
          mytitle: "quizTestPage",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          timeLimitMilliseconds,
          timeLimitFormatted,
          theme,
          isSidebarOpen
        });
      }
      else if (isResultPage) {
        res.render("quiz_result", {
          mytitle: "isResultPage",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          timeLimitMilliseconds,
          timeLimitFormatted,
          totalPoints,
          studentScore,
          attemptCount,
          percentage: (studentScore / totalPoints) * 100,
          theme,
          isSidebarOpen
        });
      }
      else if (isResultDetailPage) {
        res.render("quiz_resultDetail", {
          mytitle: "Quiz Result Detail",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          timeLimitMilliseconds,
          timeLimitFormatted,
          totalPoints,
          studentScore,
          attemptCount,
          percentage: (studentScore / totalPoints) * 100,
          theme,
          isSidebarOpen
        });
      }

      else {
        res.render("eachQuizStudent", {
          mytitle: "eachQuizStudent",
          schYear,
          quiz,
          quizzes,
          questions,
          options,
          userData,
          releaseWhenLocal,
          deadlineLocal,
          totalPoints,
          studentScore,
          attemptCount,
          percentage: (studentScore / totalPoints) * 100,
          theme,
          isSidebarOpen,


        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};



exports.createQuestion = async function (req, res, next) {
  // if (req.user.role === 'teacher') {
  try {
    if (req.files && req.files.quizImage) {
      const uploadedFile = req.files.quizImage;
      const quiz = new Quiz({
        quizname: req.body.quizname,
        quizImage: {
          data: uploadedFile.data,
          contentType: uploadedFile.mimetype,
        }
      });
      await quiz.save();
      const quiz_id = Quiz._id;
      const quiz_name = Quiz.quizName;
      res.render("adminCreateQuestion", { mytitle: "adminCreateQuestion", quiz, quiz_id, quiz_name, user: req.user });
    } else {
      const quiz = new Quiz({
        QuizName: req.body.quizname,
      });
      await quiz.save();
      const quiz_id = quiz._id;
      const quiz_name = quiz.quizname;
      res.render("adminCreateQuestion", { mytitle: "adminCreateQuestion", quiz, quiz_id, quiz_name, user: req.user });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}
// else {
//   res.redirect('/login');
// }
// }

exports.releaseQuiz = async (req, res) => {
  const { quizId } = req.params; // รับค่า quizId จาก URL
  const { isReleased, releaseWhen, deadline } = req.body;

  try {
    // ตรวจสอบว่า quizId เป็น ObjectId ที่ถูกต้องหรือไม่
    console.log('quizId from params:', quizId); // เพิ่ม log

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: 'quizId ไม่ถูกต้อง' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'ไม่พบแบบทดสอบ' });
    }

    // อัปเดตสถานะของแบบทดสอบ
    console.log('Before update:', quiz.isReleased); // ตรวจสอบสถานะก่อนอัปเดต
    quiz.isReleased = isReleased;
    quiz.releaseWhen = releaseWhen;
    quiz.deadline = deadline;
    console.log('After update:', quiz.isReleased); // ตรวจสอบสถานะหลังอัปเดต

    await quiz.save(); // บันทึกการเปลี่ยนแปลงลงฐานข้อมูล

    res.json({ success: true, message: 'ปล่อยแบบทดสอบสำเร็จ' });
  } catch (error) {
    console.error('Error:', error); // เพิ่ม log ข้อผิดพลาด
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการปล่อยแบบทดสอบ' });
  }
};

exports.scheduleQuizRelease = async (req, res) => {
  const { quizId } = req.params;
  const { releaseWhen, deadline } = req.body;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'ไม่พบแบบทดสอบ' });
    }

    // อัปเดต releaseWhen และ deadline ลงในฐานข้อมูลทันที
    quiz.releaseWhen = releaseWhen;
    quiz.deadline = deadline;

    await quiz.save();

    const releaseTime = new Date(releaseWhen);
    const deadlineTime = deadline ? new Date(deadline) : null;

    // ตรวจสอบเวลาที่ใช้สำหรับ cron job
    console.log('Release time:', releaseTime.toISOString());
    console.log('Deadline time:', deadlineTime ? deadlineTime.toISOString() : 'ไม่มีเวลา');

    // ตั้งค่า cron job สำหรับการปล่อยแบบทดสอบ
    const releaseJob = cron.schedule(
      `${releaseTime.getUTCMinutes()} ${releaseTime.getUTCHours()} ${releaseTime.getUTCDate()} ${releaseTime.getUTCMonth() + 1} *`,
      async () => {
        console.log('Cron job เริ่มทำงานที่เวลา:', new Date().toISOString());
        try {
          quiz.isReleased = true;
          await quiz.save();
          console.log(`แบบทดสอบ ${quizId} ถูกปล่อยที่เวลา ${releaseWhen}`);
          releaseJob.stop(); // หยุด cron job หลังจากปล่อยแล้ว
        } catch (error) {
          console.error('Error while releasing quiz:', error);
        }
      },
      {
        scheduled: true,
        timezone: "Asia/Bangkok", // ตั้งค่าเขตเวลาให้ตรงกับเขตเวลาของคุณ
      }
    );

    // ตั้งค่า cron job สำหรับหยุดแบบทดสอบเมื่อถึง deadline
    if (deadlineTime) {
      const deadlineJob = cron.schedule(
        `${deadlineTime.getUTCMinutes()} ${deadlineTime.getUTCHours()} ${deadlineTime.getUTCDate()} ${deadlineTime.getUTCMonth() + 1} *`,
        async () => {
          console.log('Cron job สำหรับ deadline เริ่มทำงานที่เวลา:', new Date().toISOString());
          try {
            quiz.isReleased = false; // เปลี่ยนสถานะเป็น false เมื่อถึง deadline
            quiz.releaseWhen = null; // รีเซ็ตค่า releaseWhen
            quiz.deadline = null; // รีเซ็ตค่า deadline
            await quiz.save();
            console.log(`แบบทดสอบ ${quizId} ถูกหยุดที่เวลา ${deadline} และรีเซ็ตค่า releaseWhen และ deadline`);
            deadlineJob.stop(); // หยุด cron job หลังจากหยุดแล้ว
          } catch (error) {
            console.error('Error while stopping quiz:', error);
          }
        },
        {
          scheduled: true,
          timezone: "Asia/Bangkok", // ตั้งค่าเขตเวลาให้ตรงกับเขตเวลาของคุณ
        }
      );
    }

    res.json({ success: true, message: 'ตั้งเวลาปล่อยและหยุดแบบทดสอบสำเร็จ' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตั้งเวลาปล่อยแบบทดสอบ' });
  }
};

// ฟังก์ชันสำหรับค้นหาฝั่งครู
exports.searchTeacher = async (req, res) => {
  const searchQuery = req.params.query;

  try {
    // ดึงข้อมูลผู้ใช้งานจาก session
    const userData = await User.findById(req.session.userId);
    const originPage = req.query.originPage;

    // ค้นหาแบบทดสอบทั้งหมดเพื่อแสดงใน sidebar หรือเมนูอื่น ๆ
    const quizzes = await Quiz.find().sort({ createdAt: 1 }).exec();

    // ค้นหาแบบทดสอบที่เกี่ยวข้องกับการค้นหา
    const quizResults = await Quiz.find({ quizname: new RegExp(searchQuery, 'i') });

    // ค้นหาในฐานข้อมูลสำหรับบทเรียน (lessons)
    const lessonResults = await Lesson.find({ LessonName: new RegExp(searchQuery, 'i') });
    const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });


    const theme = req.session.theme || 'light';
    const isSidebarOpen = false;

    // หากมีผลลัพธ์จากการค้นหาแบบทดสอบ ให้ดึงข้อมูลเพิ่มเติม
    if (quizResults.length > 0) {
      const quiz = quizResults[0]; // เอาผลลัพธ์ตัวแรกมาใช้
      const schYear = quiz.schoolYear ? quiz.schoolYear.schoolYear : '';
      const questions = quiz.questions || [];
      const releaseWhenLocal = quiz.releaseWhen ? moment.utc(quiz.releaseWhen).format('DD/MM/YYYY, เวลา HH:mm') : null;
      const deadlineLocal = quiz.deadline ? moment.utc(quiz.deadline).format('DD/MM/YYYY, เวลา HH:mm') : null;

      // แสดงผลลัพธ์ในหน้า searchResultsTeacher.ejs พร้อมข้อมูลที่ดึงมา
      return res.render('searchResults', {
        quiz: quizResults,
        lessons: lessonResults,
        searchQuery,
        userData,
        quizzes,
        schYear,
        questions,
        releaseWhenLocal,
        deadlineLocal,
        theme,
        isSidebarOpen,
        originPage,
        schoolYears
      });
    }

    // หากไม่มีผลลัพธ์จากการค้นหาแบบทดสอบ
    res.render('searchResults', {
      quiz: [],
      lessons: lessonResults,
      searchQuery,
      userData,
      quizzes,
      schYear: '',
      questions: [],
      releaseWhenLocal: null,
      deadlineLocal: null,
      theme,
      isSidebarOpen,
      originPage,
      schoolYears
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('เกิดข้อผิดพลาดในการค้นหาแบบทดสอบและบทเรียน');
  }
};


// ฟังก์ชันสำหรับค้นหาฝั่งนักเรียน
exports.searchStudent = async (req, res) => {
  const searchQuery = req.params.query;

  try {
    // ดึงข้อมูลผู้ใช้งานจาก session
    const userData = await User.findById(req.session.userId);
    const originPage = req.query.originPage;

    // ค้นหาแบบทดสอบทั้งหมดเพื่อแสดงใน sidebar หรือเมนูอื่น ๆ
    const quizzes = await Quiz.find().sort({ createdAt: 1 }).exec();

    // ค้นหาแบบทดสอบที่เกี่ยวข้องกับการค้นหา
    const quizResults = await Quiz.find({ quizname: new RegExp(searchQuery, 'i') });

    // ค้นหาในฐานข้อมูลสำหรับบทเรียน (lessons)
    const lessonResults = await Lesson.find({ LessonName: new RegExp(searchQuery, 'i') });
    const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });


    const theme = req.session.theme || 'light';
    const isSidebarOpen = false;

    // หากมีผลลัพธ์จากการค้นหาแบบทดสอบ ให้ดึงข้อมูลเพิ่มเติม
    if (quizResults.length > 0) {
      const quiz = quizResults[0]; // เอาผลลัพธ์ตัวแรกมาใช้
      const schYear = quiz.schoolYear ? quiz.schoolYear.schoolYear : '';
      const questions = quiz.questions || [];
      const releaseWhenLocal = quiz.releaseWhen ? moment.utc(quiz.releaseWhen).format('DD/MM/YYYY, เวลา HH:mm') : null;
      const deadlineLocal = quiz.deadline ? moment.utc(quiz.deadline).format('DD/MM/YYYY, เวลา HH:mm') : null;

      // แสดงผลลัพธ์ในหน้า searchResultsStudent.ejs พร้อมข้อมูลที่ดึงมา
      return res.render('searchResults', {
        quiz: quizResults,
        lessons: lessonResults,
        searchQuery,
        userData,
        quizzes,
        schYear,
        questions,
        releaseWhenLocal,
        deadlineLocal,
        theme,
        isSidebarOpen,
        originPage,
        schoolYears,

      });
    }

    // หากไม่มีผลลัพธ์จากการค้นหาแบบทดสอบ
    res.render('searchResults', {
      quiz: [],
      lessons: lessonResults,
      searchQuery,
      userData,
      quizzes,
      schYear: '',
      questions: [],
      releaseWhenLocal: null,
      deadlineLocal: null,
      theme,
      isSidebarOpen,
      originPage,
      schoolYears
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('เกิดข้อผิดพลาดในการค้นหาแบบทดสอบและบทเรียน');
  }
};







