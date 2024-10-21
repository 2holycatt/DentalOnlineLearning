const Lesson = require("../models/Lessons");
const Layout1 = require("../models/Layout1");
const fs = require('fs');
const path = require('path');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const Layout2 = require("../models/Layout2");
const Layout3 = require("../models/Layout3");
const Layout4 = require("../models/Layout4");
const Layout5 = require("../models/Layout5");
const PdfFile = require("../models/pdfFile");
const Student = require("../models/student.model");
const Notification = require("../models/notification");
const User = require("../models/user.model");
const Comment = require("../models/comment");
const SchoolYear = require("../models/schoolYear");
const Subject = require("../models/subjects");
const { logs } = require('../controller/LogsFile');
const PDFDocument = require('pdfkit');
const lessonQuestion = require("../models/LessonQuestion");
const StudentAnswer = require("../models/StudentAnswerEndChapQuestion");
const TextEditor = require("../models/TextEditor");
const Assignment = require("../models/Assignments");
const { deleteFileFromS3 } = require('../utils/s3Utils');

// const atob = require('atob');
const fontPath = path.join(__dirname, 'THSarabunNew.ttf'); // ระบุที่อยู่ของไฟล์ฟอนต์ THSarabun.ttf
const multer = require('multer');
// const upload = multer();
const { exec } = require('child_process');
const moment = require('moment');

const { createNotification } = require('./notificationController');
const { sendEmail } = require('../service/notification');


// ฟังก์ชันสำหรับการทำ pagination ให้กับ lesson
// function paginate(array, page_size, page_number) {
//   return array.slice((page_number - 1) * page_size, page_number * page_size);
// }

// const updateSubjectQueue = require('../service/queue');


const adminIndex = async (req, res) => {
  try {
    const userData = await User.findById(req.session.userId);
    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    const getLessonId = req.query.lessonId;
    const lesson = await Lesson.findById(getLessonId);
    // console.log(userData);
    res.render("adminIndex", { lessons, lesson, userData });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}


const notLoggedIn = async (req, res) => {
  try {
    let permission = req.query.permission;
    let noPermission = null
    if (permission) {
      noPermission = "คุณไม่มีสิทธิ์ในการเข้าใช้งาน"
    }
    res.render("notLoggedIn", { noPermission });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const manageStudent = async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    const getLessonId = req.query.lessonId;
    const lesson = await Lesson.findById(getLessonId);

    res.render("manageStudent", { lessons, lesson });
    // res.json(allStudents);

  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const uploadStudent = async (req, res) => {
  try {
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    // const getLessonId = req.query.lessonId;
    // const lesson = await Lesson.findById(getLessonId);

    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: 1 }, // เรียงลำดับจากใหม่ไปเก่า
      populate: 'user',
    };

    const allStudents = await Student.paginate({}, options);
    // res.json(allStudents);
    // const findStudent = await User.findOne({email:"papinwit.s@kkumail.com"});
    // res.json(allStudents);
    res.render("upload-excelAndmanual", { allStudents });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const uploadStudent2 = async (req, res) => {
  try {

    res.render("upload-file-2", { formData: {}, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const getEditLessonNamePage = async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    const getLessonId = req.query.lessonId;
    const lesson = await Lesson.findById(getLessonId);

    res.render("EditLessonNamePage", { lessons, lesson });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const editLessonName = async (req, res) => {
  try {
    const _id = req.body._id;

    const editNameNumber = {
      LessonName: req.body.LessonName,
      LessonNumber: req.body.LessonNumber
    }

    const result = await Lesson.findOneAndUpdate(
      { _id: _id },
      { $set: editNameNumber },
      { new: true }
    );

    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    res.render("adminLessonIndex", { mytitle: "adminLessonIndex", lessons });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}


const adminLessonIndex = async (req, res) => {
  try {
    const originPage = req.query.originPage;
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).populate("subject");
    // console.log(lessons)
    const subject = await Subject.find().sort({ semester: 1 }).populate("lessonArray");
    // res.json(subject);
    // res.json(lessons);
    const findSubject = null;

    // console.log(subject);
    res.render("adminLessonIndex", { mytitle: "adminLessonIndex", originPage: originPage, subject, findSubject });

  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const schoolYearRender = async (req, res) => {
  try {
    const originPage = req.query.originPage;
    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });
    const selectedYear = req.query.year;
    // console.log(selectedYear)
    const findYear = await SchoolYear.findOne({ schoolYear: selectedYear });
    res.redirect(`/adminLessonIndex?lessons=${JSON.stringify(lessons)}&originPage=${originPage}&findYear=${JSON.stringify(findYear)}`);


  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}


const addLesson = async (req, res) => {
  try {
    const subjectDbId = req.query.subjectDbId;
    const subjectId = req.query.subjectId;
    const subjectName = req.query.subjectName;
    const subjectSection = req.query.subjectSection;
    const subjectSemester = req.query.subjectSemester;

    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    // const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });
    res.render("addLesson", { mytitle: "addLesson", lessons, subjectDbId, subjectId, subjectName, subjectSection, subjectSemester });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}

// const editLesson = async (req, res) => {
//   try {
//     const lessonId = req.query.lessonId;
//     const findLesson = await Lesson.findById(lessonId);
//     // const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });
//     res.render("editLesson", { mytitle: "editLesson", findLesson});
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("เกิดข้อผิดพลาด");
//   }

// }



// สำหรับการดึงข้อมูลรายวิชา
async function getUniqueSubjectValues() {
  const findSubjects = await Subject.find().sort({ semester: 0 });

  const uniqueValues = {};

  findSubjects.forEach(subject => {
    Object.entries(subject.toObject()).forEach(([key, value]) => {
      if (!uniqueValues[key]) {
        uniqueValues[key] = new Set();
      }
      uniqueValues[key].add(value);
    });
  });

  const result = {};
  Object.entries(uniqueValues).forEach(([key, valueSet]) => {
    result[key] = Array.from(valueSet);
  });

  // สร้าง filteredResult และตรวจสอบค่าจาก result
  const filteredResult = {
    subjectId: result.subjectId ? result.subjectId : [],
    subjectName: result.subjectName ? result.subjectName : [],
    semester: result.semester ? result.semester : []
  };

  return filteredResult;
}


const addSubject = async (req, res) => {
  try {
    // const SubjectId = req.query.subjectId;
    // const SubjectSemester = req.query.subjectSemester;
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();

    // console.log(filteredResult);
    const filteredResult = await getUniqueSubjectValues();
    // console.log(filteredResult);
    res.render("addSubjects", { mytitle: "addSubject", filteredResult: filteredResult || [], formData: {}, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}

const editSubject = async (req, res) => {
  try {
    const SubjectId = req.query.subjectId;
    const findSubject = await Subject.findOne({ _id: SubjectId });
    // res.json(findSubject);
    let error = req.query.error || null;
    // const SubjectSemester = req.query.subjectSemester;
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();

    // console.log(filteredResult);
    // const filteredResult = await getUniqueSubjectValues();
    // // console.log(filteredResult);
    res.render("editSubjects", { mytitle: "editSubjects", findSubject, error });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}

const updateSubject = async (req, res) => {
  try {
    const { subjectDbId, subjectId, subjectName, semester, unit, section } = req.body;

    const findSubject = await Subject.findByIdAndUpdate(
      { _id: subjectDbId },
      {
        $set: {
          subjectId: subjectId,
          subjectName: subjectName,
          semester: semester,
          unit: unit,
          section: section
        }
      },
      { new: true }
    );
    res.redirect(`/adminIndex/manageSubject?subjectDbId=${subjectDbId}`);
    // res.json(findSubject);

    // const SubjectSemester = req.query.subjectSemester;
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();

    // console.log(filteredResult);
    // const filteredResult = await getUniqueSubjectValues();
    // // console.log(filteredResult);
    // res.render("editSubjects", { mytitle: "editSubjects", findSubject, error: null });
  } catch (err) {
    console.error(err);
    const { subjectDbId, subjectId, subjectName, semester, unit, section } = req.body;

    if (err.code === 11000) { // รหัสข้อผิดพลาดสำหรับ duplicate key error
      return res.redirect(`/adminIndex/editSubject?subjectId=${subjectDbId}&error=มีรายวิชานี้อยู่ในระบบแล้ว`);

      // const formData = `subjectId=${subjectId}&subjectName=${subjectName}&semester=${semester}&unit=${unit}&section=${section}&error=วิชานี้มีอยู่แล้วในภาคการศึกษานี้`;
      // return res.redirect(`/adminIndex/addSubject?${formData}`);
    } else {
      return res.status(500).send('An error occurred');
    }
  }

}

const updateLesson = async (req, res) => {
  try {
    const { lessonId, lessonName } = req.body;
    const file = req.file;

    const findLesson = await Lesson.findById(lessonId);

    if (findLesson.file && req.file) {
      const result = await deleteFileFromS3(findLesson.file);
      // var filePath = path.join(__dirname, '../uploads', findLesson.file); // สร้าง path ของไฟล์
      var fileToUpdate = req.file.location;


      findLesson.LessonName = lessonName;
      findLesson.file = fileToUpdate;
      findLesson.save();

    } else if (!findLesson.file && req.file) {
      var fileToUpdate = req.file.location;
      findLesson.LessonName = lessonName;
      findLesson.file = fileToUpdate;
      findLesson.save();
    } else if (!findLesson.file && !req.file) {
      findLesson.LessonName = lessonName;
      findLesson.save();
    } else {
      findLesson.LessonName = lessonName;
      findLesson.save();
    }

    res.redirect(`/adminIndex/editLesson?lessonId=${lessonId}&subjectId=${findLesson.subject.subjectMongooseId}`);

  } catch (err) {
    console.error(err);
  }

}

const copyLessons = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    const subjectWithLessons = await Subject.findById(subjectId)
      .populate(
        "lessonArray"
      );
    const subjectToCopy = await Subject.find({ _id: { $ne: subjectId } }).populate("lessonArray");
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).populate("schoolYear");
    // const schoolYears = await SchoolYear.find().sort({ schoolYear: 0 });
    // const findYear = null;

    res.render("copyLessons", { mytitle: "copyLessons", subjectWithLessons, subjectToCopy });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}

const createLayout = async function (req, res, next) {

  try {
    const userData = await User.findById(req.session.userId);
    const { subjectDbId, subjectId } = req.body
    // const username = userData.name;
    // const checkExists = await SchoolYear.findOne({ schoolYear });
    const users = await User.find();
    const whatCome = "มีบทเรียนเรื่อง";
    const subject = "บทเรียนใหม่จาก Online Dentristy Learning";
    const name = req.body.lessonName;

    // async function callUpdate() {
    //   try {
    //     await updateSubjectQueue.add({
    //       subjectId: subjectDbId
    //     });
    //   } catch (error) {
    //     console.error('Error during callUpdate:', error);
    //   }
    // };

    if (req.file) {
      const file = req.file.location;
      // const uploadedFile = req.files.LessonImage;
      const lessonCreate = new Lesson({
        LessonName: name,
        file,
        subject: {
          subjectMongooseId: subjectDbId,
          subjectId: subjectId
        }
      });
      await lessonCreate.save();
      const addId = await Subject.findByIdAndUpdate(
        subjectDbId,
        { $push: { lessonArray: lessonCreate._id } },
        { new: true, runValidators: true }
      ).exec();

      // const schYear = addId.schoolYear;
      // const lessons = await Lesson.find().sort({ createdAt: 1 }).populate("schoolYear");

      const findUser = await Subject.findById(subjectDbId)
        .populate({
          path: "students",
          populate: {
            path: "user"
          }
        });

      const allStudent = findUser.students;
      const subjectName = `${findUser.subjectId} ภาคการศึกษา: ${findUser.semester} กลุ่มที่${findUser.section}:`;
      // if (allStudent) {
      //   allStudent.forEach(student => {
      //     const email = student.user.email;
      //     sendEmail(email, subject, name, username, whatCome, subjectName);
      //   });
      //   // const email = findUser.email;
      // }
      // await Promise.all(users.map(async user => {


      // }));

      // createNotification(`${userData._id}`, `${userData.name}`, `${whatCome} "${name}" ถูกเพิ่มใหม่ลงในระบบ`, req, res, next)
      // await callUpdate();
      res.redirect(`/adminIndex/eachLessons?lessonId=${lessonCreate._id}`);

      // console.log(addId)
      // const lesson_id = lesson._id;
      // const lesson_name = lesson.lessonName;
      // res.render("adminCreateLayout", { mytitle: "adminCreateLayout", lesson, lesson_id, lesson_name });
    } else {
      const lessonCreate = new Lesson({
        LessonName: name,
        subject: {
          subjectMongooseId: subjectDbId,
          subjectId: subjectId
        }
      });
      await lessonCreate.save();
      const addId = await Subject.findByIdAndUpdate(
        subjectDbId,
        { $push: { lessonArray: lessonCreate._id } },
        { new: true, runValidators: true }
      ).exec();


      // await Promise.all(users.map(async user => {
      //   const findUser = await User.findById(user._id)
      //     .populate({
      //       path: "student",
      //     });
      //   // if (findUser.student && (findUser.student.schoolYear.schoolYear == checkExists.schoolYear)) {
      //   //   const email = user.email;
      //   //   sendEmail(email, subject, name, userData, whatCome);
      //   // }

      // }));
      // await Promise.all(users.map(async user => {
      //   const findUser = await Subject.findById(subjectDbId)
      //     .populate({
      //       path: "students",
      //       populate: {
      //         path: "user"
      //       }
      //     });
      //   const allStudent = findUser.students;
      //   if (allStudent) {
      //     allStudent.forEach(student => {
      //       const email = student.user.email;
      //       sendEmail(email, subject, name, userData, whatCome);
      //     });
      //     // const email = findUser.email;
      //   }
      // }));
      const findUser = await Subject.findById(subjectDbId)
        .populate({
          path: "students",
          populate: {
            path: "user"
          }
        });
      const subjectName = `${findUser.subjectId} ภาคการศึกษา: ${findUser.semester} กลุ่มที่${findUser.section}:`;
      const allStudent = findUser.students;
      // if (allStudent) {
      //   allStudent.forEach(student => {
      //     const email = student.user.email;
      //     sendEmail(email, subject, name, username, whatCome, subjectName);
      //   });
      //   // const email = findUser.email;
      // }

      // createNotification(`${userData._id}`, `${userData.name}`, `${whatCome} "${name}" ถูกเพิ่มใหม่ลงในระบบ`, req, res, next)
      // await callUpdate();

      res.redirect(`/adminIndex/eachLessons?lessonId=${lessonCreate._id}`);
      // res.render("adminCreateLayout", { mytitle: "adminCreateLayout", lesson, lesson_id, lesson_name });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}

const createSubject = async (req, res, next) => {
  try {
    const { subjectId, subjectName, semester, unit, section } = req.body;

    const newSubject = new Subject({
      subjectId,
      subjectName,
      semester,
      unit,
      section
    })

    await newSubject.save();
    res.redirect('/adminIndex/adminLessonIndex');
  } catch (err) {
    console.error(err);
    // const { subjectId, subjectName, semester, unit, section } = req.body;
    const filteredResult = await getUniqueSubjectValues();

    if (err.code === 11000) { // รหัสข้อผิดพลาดสำหรับ duplicate key error
      return res.render('addSubjects', {
        error: 'มีรายวิชานี้อยู่ในระบบแล้ว',
        formData: req.body, // ส่งข้อมูลฟอร์มกลับไปเพื่อให้ผู้ใช้ไม่ต้องกรอกใหม่
        filteredResult
      });
      // const formData = `subjectId=${subjectId}&subjectName=${subjectName}&semester=${semester}&unit=${unit}&section=${section}&error=วิชานี้มีอยู่แล้วในภาคการศึกษานี้`;
      // return res.redirect(`/adminIndex/addSubject?${formData}`);
    } else {
      return res.status(500).send('An error occurred');
    }
  }
}

// const createLayout_01 = async (req, res) => {
//     try {
//         const { _id, Topic, MainDescription, SubDescription, title, ImageDescription } = req.body;
//         const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);

//         const Url = {
//           data: fs.readFileSync(filePath),
//         };

//         const newLayout = new Layout1({
//           Topic,
//           MainDescription,
//           SubDescription,
//           AboutImage: {
//             title,
//             Url,
//             ImageDescription,
//           },
//           LessonArrayObject: [{ LessonId: _id }],
//         });

//         const savedLayout = await newLayout.save();

//         const lessons = await Lesson.findByIdAndUpdate(
//           _id,
//           { $push: { LayOut1ArrayObject: savedLayout._id } },
//           { new: true }
//         );

//         res.redirect('addLesson');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("เกิดข้อผิดพลาด");
//     }
// };


const eachLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    const lessonId = req.query.lessonId;

    // const { page = 1, limit = 4 } = req.query;

    // const options = {
    //   page: parseInt(page, 10),
    //   limit: parseInt(limit, 10),
    //   sort: { createdAt: -1 } // เรียงลำดับจากใหม่ไปเก่า
    // };

    // const options = {
    //   page: parseInt(page, 10),
    //   limit: parseInt(limit, 10),
    //   populate: 'schoolYear' // populate schoolYear field
    // };

    const lesson = await Lesson.findById(lessonId).populate('subject.subjectMongooseId').populate('lessonQuestion');
    // const result = await Lesson.paginate({ _id: lessonId }, options);
    // res.json(lesson);
    // console.log(lesson)
    // const lessonComment = await Lesson.findById(lessonId).populate("comments");
    const userData = await User.findById(req.session.userId);

    // const notifications = await Notification.paginate({}, options);

    const subject = lesson.subject.subjectMongooseId;
    const layout01 = lesson.LayOut1ArrayObject;
    const layout02 = lesson.LayOut2ArrayObject;
    const layout03 = lesson.LayOut3ArrayObject;
    const layout04 = lesson.LayOut4ArrayObject;
    const layout05 = lesson.LayOut5ArrayObject;
    const pdfFiles = lesson.PdfFiles;
    const textEditor = lesson.TextEditors;

    const lessonComment = await Lesson.findById(lessonId)
      .populate({
        path: "comments",
        populate: [
          { path: "user" },
          { path: "replies.user" }
        ]
      });

    // ฟังก์ชันสำหรับจัดรูปแบบวันที่
    function formatDate(date) {
      const formattedDate = moment(date).format("DD/MM/YYYY HH:mm A");
      return formattedDate;
    }

    // ฟังก์ชันสำหรับคำนวณจำนวนวันที่ผ่านไป
    function timeSince(date) {
      const now = moment();
      const seconds = now.diff(date, "seconds");
      const minutes = now.diff(date, "minutes");
      const hours = now.diff(date, "hours");
      const days = now.diff(date, "days");
      const weeks = now.diff(date, "weeks");
      const months = now.diff(date, "months");

      if (seconds < 60) {
        return `${seconds} วินาทีที่แล้ว`;
      } else if (minutes < 60) {
        return `${minutes} นาทีที่แล้ว`;
      } else if (hours < 24) {
        return `${hours} ชั่วโมงที่แล้ว`;
      } else if (days < 7) {
        return `${days} วันที่แล้ว`;
      } else if (weeks < 4) {
        return `${weeks} สัปดาห์ ${days % 7} วันที่แล้ว`;
      } else if (months < 12) {
        return `${months} เดือนที่แล้ว`;
      } else {
        return moment(date).format("YYYY-MM-DD");
      }
    }

    // แก้ไข comments โดยใช้ map ฟังก์ชัน
    lessonComment.comments = lessonComment.comments.map((comment) => {
      comment.createdAtFormatted = formatDate(comment.createdAt);
      comment.timeSince = timeSince(comment.createdAt);
      comment.replies = comment.replies.map((reply) => {
        reply.createdAtFormatted = formatDate(reply.createdAt);
        reply.timeSince = timeSince(reply.createdAt);
        return reply;
      });
      return comment;
    });
    // let pdfLists = [];
    // for (const id of layout05) {
    //   const findLayout = await Layout5.findById(id);
    // }

    const foundLayouts = [];
    async function findLayoutsAndStoreData(deleteLayouts, Layout) {

      if (deleteLayouts.length > 0) {
        for (const layoutId of deleteLayouts) {
          const foundLayout = await Layout.findById(layoutId);
          if (foundLayout) {
            foundLayouts.push(foundLayout);
          }
        }
      }

      return foundLayouts;
    }

    const foundLayouts1 = await findLayoutsAndStoreData(layout01, Layout1);
    const foundLayouts2 = await findLayoutsAndStoreData(layout02, Layout2);
    const foundLayouts3 = await findLayoutsAndStoreData(layout03, Layout3);
    const foundLayouts4 = await findLayoutsAndStoreData(layout04, Layout4);
    const foundLayouts5 = await findLayoutsAndStoreData(layout05, Layout5);
    const foundPdfFiles = await findLayoutsAndStoreData(pdfFiles, PdfFile);
    const foundPdfTextEditor = await findLayoutsAndStoreData(textEditor, TextEditor);

    foundLayouts.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      if (dateA < dateB) {
        return -1;
      } else if (dateA > dateB) {
        return 1;
      } else {
        return 0;
      }
    });

    // res.json(foundLayouts);

    const page = parseInt(req.query.page) || 1;
    const pageSize = 4; // จำนวนข้อมูลต่อหน้า
    // const paginatedLayouts = paginate(foundLayouts, pageSize, page);
    const totalPages = Math.ceil(foundLayouts.length / pageSize);

    // ตรวจสอบว่า paginate มีการนำเข้าและใช้งานถูกต้อง
    function paginate(array, pageSize, page) {
      return array.slice((page - 1) * pageSize, page * pageSize);
    }

    const paginatedLayouts = paginate(foundLayouts, pageSize, page);

    // console.log(totalPages+" "+page)

    // res.json(foundLayouts)
    // res.json(lay01_contents)
    // console.log(subject);

    // const lessonQuestions = await lessonQuestion.find().exec();
    res.render("eachLessons", {
      mytitle: "eachLessons",
      lesson,
      lessons,
      subject,
      lessonComment,
      userData,
      pdfFilesJson: JSON.stringify(pdfFiles),
      currentPage: page,
      paginatedLayouts,
      totalPages,
      // lessonQuestion
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const eachLessonStudent = async (req, res) => {
  try {
    const lessonId = req.query.lessonId;


    const lesson = await Lesson.findById(lessonId).populate("subject.subjectMongooseId")
      .populate("lessonQuestion");
    // const lessonComment = await Lesson.findById(lessonId).populate("comments");
    const userData = await User.findById(req.session.userId);
    let studentAnswer = null;
    if (lesson.lessonQuestion) {
      let findStudentAnswer = await StudentAnswer.findOne(
        {
          lessonQuestion: lesson.lessonQuestion._id,
          user: userData._id
        }
      ) || [];
      studentAnswer = findStudentAnswer;
    }

    const layout01 = lesson.LayOut1ArrayObject;
    const layout02 = lesson.LayOut2ArrayObject;
    const layout03 = lesson.LayOut3ArrayObject;
    const layout04 = lesson.LayOut4ArrayObject;
    const layout05 = lesson.LayOut5ArrayObject;
    const pdfFiles = lesson.PdfFiles;
    const textEditor = lesson.TextEditors;


    const lessonComment = await Lesson.findById(lessonId)
      .populate({
        path: "comments",
        populate: [
          { path: "user" },
          { path: "replies.user" }
        ]
      });

    // ฟังก์ชันสำหรับจัดรูปแบบวันที่
    function formatDate(date) {
      const formattedDate = moment(date).format("DD/MM/YYYY HH:mm A");
      return formattedDate;
    }

    // ฟังก์ชันสำหรับคำนวณจำนวนวันที่ผ่านไป
    function timeSince(date) {
      const now = moment();
      const seconds = now.diff(date, "seconds");
      const minutes = now.diff(date, "minutes");
      const hours = now.diff(date, "hours");
      const days = now.diff(date, "days");
      const weeks = now.diff(date, "weeks");
      const months = now.diff(date, "months");

      if (seconds < 60) {
        return `${seconds} วินาทีที่แล้ว`;
      } else if (minutes < 60) {
        return `${minutes} นาทีที่แล้ว`;
      } else if (hours < 24) {
        return `${hours} ชั่วโมงที่แล้ว`;
      } else if (days < 7) {
        return `${days} วันที่แล้ว`;
      } else if (weeks < 4) {
        return `${weeks} สัปดาห์ ${days % 7} วันที่แล้ว`;
      } else if (months < 12) {
        return `${months} เดือนที่แล้ว`;
      } else {
        return moment(date).format("YYYY-MM-DD");
      }
    }

    // แก้ไข comments โดยใช้ map ฟังก์ชัน
    lessonComment.comments = lessonComment.comments.map((comment) => {
      comment.createdAtFormatted = formatDate(comment.createdAt);
      comment.timeSince = timeSince(comment.createdAt);
      comment.replies = comment.replies.map((reply) => {
        reply.createdAtFormatted = formatDate(reply.createdAt);
        reply.timeSince = timeSince(reply.createdAt);
        return reply;
      });
      return comment;
    });

    // res.json(lessonComment);
    let pdfLists = [];
    for (const id of layout05) {
      const findLayout = await Layout5.findById(id);
    }

    const foundLayouts = [];
    async function findLayoutsAndStoreData(deleteLayouts, Layout) {

      if (deleteLayouts.length > 0) {
        for (const layoutId of deleteLayouts) {
          const foundLayout = await Layout.findById(layoutId);
          if (foundLayout) {
            foundLayouts.push(foundLayout);
          }
        }
      }

      return foundLayouts;
    }

    const foundLayouts1 = await findLayoutsAndStoreData(layout01, Layout1);
    const foundLayouts2 = await findLayoutsAndStoreData(layout02, Layout2);
    const foundLayouts3 = await findLayoutsAndStoreData(layout03, Layout3);
    const foundLayouts4 = await findLayoutsAndStoreData(layout04, Layout4);
    const foundLayouts5 = await findLayoutsAndStoreData(layout05, Layout5);
    const foundPdfFiles = await findLayoutsAndStoreData(pdfFiles, PdfFile);
    const foundTextEditor = await findLayoutsAndStoreData(textEditor, TextEditor);

    // console.log(foundLayouts5);

    foundLayouts.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      if (dateA < dateB) {
        return -1;
      } else if (dateA > dateB) {
        return 1;
      } else {
        return 0;
      }
    });



    const page = parseInt(req.query.page) || 1;
    const pageSize = 4; // จำนวนข้อมูลต่อหน้า
    // const paginatedLayouts = paginate(foundLayouts, pageSize, page);
    const totalPages = Math.ceil(foundLayouts.length / pageSize);

    // ตรวจสอบว่า paginate มีการนำเข้าและใช้งานถูกต้อง
    function paginate(array, pageSize, page) {
      return array.slice((page - 1) * pageSize, page * pageSize);
    }

    const paginatedLayouts = paginate(foundLayouts, pageSize, page);

    await updateLessonProgress(req, res);

    // ค้นหาผู้ใช้และความคืบหน้า
    //  const user = await User.findById(userId);
    const progress = userData.lessonProgress && userData.lessonProgress[lessonId] || 0;

    // คำนวณเปอร์เซ็นต์ความคืบหน้า
    const percentage = Math.min(100, (progress / totalPages) * 100);

    // console.log(totalPages+" "+page)
    const lessonQuestions = lesson.lessonQuestion || null;
    // res.json(foundLayouts)
    // res.json(lay01_contents)
    // res.json(studentAnswer);
    res.render("eachLessonStudent", {
      mytitle: "eachLessonStudent",
      lesson,
      lessonComment,
      userData,
      pdfFilesJson: JSON.stringify(pdfFiles),
      currentPage: page,
      paginatedLayouts,
      totalPages,
      percentage,
      lessonQuestions,
      studentAnswer
    });

    // res.render("eachLessonStudent", { mytitle: "eachLessons", lesson, lessons, foundLayouts, schYear, lessonComment, userData });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const adminExamsIndex = async (req, res) => {
  try {
    res.render("adminExam");
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}

const pdfDowload = async (req, res) => {
  try {
    const LayoutId = req.query.id;
    const layout = await Layout5.findById(LayoutId);
    if (!layout) {
      return res.status(404).send('Layout not found');
    }
    // สร้าง PDF
    const base64Data = layout.PdfFile.content.toString('base64');
    const buffer = Buffer.from(base64Data, 'base64');
    // สร้าง PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `inline; filename="${layout.PdfFile.filename}"`);
    // เขียนข้อมูลลงใน PDF
    doc.pipe(res);
    doc.font(fontPath) // กำหนดฟอนต์ภาษาไทย
      .fontSize(12)
      .text(buffer.toString('utf-8'), 100, 100); // แสดงข้อความ
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

const showFile = async (req, res) => {
  try {
    const pdfId = req.query.pdfId;
    // const { id } = req.params;
    const item = await Layout5.findById(pdfId);
    if (!item) {
      return next(new Error("No item found"));
    }
    const file = item.file;
    const filePath = path.join(__dirname, `../${file}`);

    // Set content type header
    res.setHeader('Content-Type', 'application/pdf');

    // Send the PDF file directly
    fs.createReadStream(filePath).pipe(res);

    // const base64String = Buffer.from(pdfData.PdfFile.content).toString('base64');
    // const blob = new Blob([base64String], { type: 'application/pdf' });
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename="' + pdfData.filename + '"');
    // res.send(blob);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving PDF');
  }
};

const logsFile = async (req, res) => {
  try {
    const userData = await User.findById(req.session.userId);

    // ดึง logs
    logs(req, res, (data) => {
      // Render หน้า EJS พร้อมข้อมูล logs และข้อมูลผู้ใช้
      // console.log('Logs data:', data); // ตรวจสอบข้อมูลในคอนโซล
      res.render('logsFile', { logs: data.logs, user: userData });
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const teacherNotification = async (req, res) => {
  try {
    const userData = await User.findById(req.session.userId);
    const lessons = await Lesson.find().sort({ createdAt: -1 }).exec();
    const getLessonId = req.query.lessonId;
    const lesson = await Lesson.findById(getLessonId);
    // const notifications = await Notification.find().sort({ createdAt: -1 }).exec();

    const { page = 1, limit = 1 } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 } // เรียงลำดับจากใหม่ไปเก่า
    };

    const notifications = await Notification.paginate({}, options);

    res.render("teacherNoti", { lessons, lesson, userData, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const createComment = async (req, res) => {
  try {
    const { comment, lessonId } = req.body;
    const files = req.files;
    const userData = await User.findById(req.session.userId);

    const createComment = new Comment(
      {
        comment: comment,
        user: userData._id,
        Lesson: lessonId
      }
    )
    await createComment.save();

    // console.log(files);
    const fileData = files.map(files => {
      return {
        file: files.location,
        contentType: files.mimetype
      };
    });
    await createComment.save();

    const commentId = createComment._id;
    for (const i of fileData) {
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $push: { files: i } },
        { new: true }
      );
    }

    const addCommentIntoLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      { $push: { comments: commentId } },
      { new: true }
    )

    if (userData.role == "teacher") {
      res.redirect(`/adminIndex/eachLessons?lessonId=${lessonId}`)

    } else if (userData.role == "student") {
      res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`)
    }
    // res.json(files);
    // console.log(files);
  } catch (err) {
    console.log(err)
  }
}

const editComment = async (req, res) => {
  try {
    const commentId = req.query.commentId;
    // const getComment = await Comment.findById(commentId);
    const userData = await User.findById(req.session.userId);
    const lessonId = req.query.lessonId;

    const getComment = await Comment.findById(commentId).populate("user");

    // ฟังก์ชันสำหรับจัดรูปแบบวันที่
    function formatDate(date) {
      const formattedDate = moment(date).format("DD/MM/YYYY HH:mm A");
      return formattedDate;
    }

    // ฟังก์ชันสำหรับคำนวณจำนวนวันที่ผ่านไป
    function timeSince(date) {
      const now = moment();
      const seconds = now.diff(date, "seconds");
      const minutes = now.diff(date, "minutes");
      const hours = now.diff(date, "hours");
      const days = now.diff(date, "days");
      const weeks = now.diff(date, "weeks");
      const months = now.diff(date, "months");

      if (seconds < 60) {
        return `${seconds} วินาทีที่แล้ว`;
      } else if (minutes < 60) {
        return `${minutes} นาทีที่แล้ว`;
      } else if (hours < 24) {
        return `${hours} ชั่วโมงที่แล้ว`;
      } else if (days < 7) {
        return `${days} วันที่แล้ว`;
      } else if (weeks < 4) {
        return `${weeks} สัปดาห์ ${days % 7} วันที่แล้ว`;
      } else if (months < 12) {
        return `${months} เดือนที่แล้ว`;
      } else {
        return moment(date).format("YYYY-MM-DD");
      }
    }

    // แก้ไข getComment โดยใช้ฟังก์ชัน formatDate และ timeSince
    getComment.createdAtFormatted = formatDate(getComment.createdAt);
    getComment.timeSince = timeSince(getComment.createdAt);

    // console.log(getComment);
    // res.json(getComment)
    res.render("editComment", { userData, getComment, lessonId });
    // if (userData.role == "teacher") {
    // res.render("editComment", { userData, getComment, lessonId });
    // } else if (userData.role == "student") {
    //   res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`)
    // }
  } catch (err) {
    console.log(err)
  }
}

const editCommentStudent = async (req, res) => {
  try {
    const commentId = req.query.commentId;
    // const getComment = await Comment.findById(commentId);
    const userData = await User.findById(req.session.userId);
    const lessonId = req.query.lessonId;

    const getComment = await Comment.findById(commentId).populate("user");

    // ฟังก์ชันสำหรับจัดรูปแบบวันที่
    function formatDate(date) {
      const formattedDate = moment(date).format("DD/MM/YYYY HH:mm A");
      return formattedDate;
    }

    // ฟังก์ชันสำหรับคำนวณจำนวนวันที่ผ่านไป
    function timeSince(date) {
      const now = moment();
      const seconds = now.diff(date, "seconds");
      const minutes = now.diff(date, "minutes");
      const hours = now.diff(date, "hours");
      const days = now.diff(date, "days");
      const weeks = now.diff(date, "weeks");
      const months = now.diff(date, "months");

      if (seconds < 60) {
        return `${seconds} วินาทีที่แล้ว`;
      } else if (minutes < 60) {
        return `${minutes} นาทีที่แล้ว`;
      } else if (hours < 24) {
        return `${hours} ชั่วโมงที่แล้ว`;
      } else if (days < 7) {
        return `${days} วันที่แล้ว`;
      } else if (weeks < 4) {
        return `${weeks} สัปดาห์ ${days % 7} วันที่แล้ว`;
      } else if (months < 12) {
        return `${months} เดือนที่แล้ว`;
      } else {
        return moment(date).format("YYYY-MM-DD");
      }
    }

    // แก้ไข getComment โดยใช้ฟังก์ชัน formatDate และ timeSince
    getComment.createdAtFormatted = formatDate(getComment.createdAt);
    getComment.timeSince = timeSince(getComment.createdAt);

    // console.log(getComment);
    // res.json(getComment)
    res.render("editCommentStudent", { userData, getComment, lessonId });
  } catch (err) {
    console.log(err)
  }
}

const makeEditComment = async (req, res,) => {
  try {
    const { commentId, comment } = req.body;
    // console.log(commentId);
    const files = req.files;

    const updateComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { comment: comment } },
      { new: true }
    )

    // ลบไฟล์ที่ถูกติ๊กออกจากโฟลเดอร์และฐานข้อมูล
    const filesToKeep = [];
    const filesToDelete = [];

    updateComment.files.forEach((file, index) => {
      if (req.body[`file${index}`]) {
        filesToDelete.push(file.file);
      } else {
        filesToKeep.push(file);
      }
    });

    // ลบไฟล์จากโฟลเดอร์ uploads
    for (i of filesToDelete) {
      let deleteFile = await deleteFileFromS3(i);

    }
    // filesToDelete.forEach(file => {
    //   let deleteFile = await deleteFileFromS3(file);
    //   const filePath = path.join(__dirname, '..', 'uploads', file);
    //   fs.unlink(filePath, err => {
    //     if (err) {
    //       console.error(`Error deleting file ${file}: `, err);
    //     }
    //   });
    // });

    // อัปเดตเอกสารในฐานข้อมูล
    updateComment.comment = comment;
    updateComment.files = filesToKeep;
    await updateComment.save();

    const fileData = files.map(files => {
      return {
        file: files.location,
        contentType: files.mimetype
      };
    });

    for (const i of fileData) {
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $push: { files: i } },
        { new: true }
      );
    }
    const userData = await User.findById(req.session.userId);
    if (userData.role == "student") {
      res.redirect(`/studentIndex/editCommentStudent?commentId=${commentId}`)
    } else if (userData.role == 'teacher') {
      res.redirect(`/adminIndex/editComment?commentId=${commentId}`)
    }
  } catch (err) {
    console.log(err);
  }
}

const deleteComment = async (req, res) => {
  try {
    const commentId = req.query.commentId;
    const lessonId = req.query.lessonId;
    const comment = await Comment.findById(commentId);
    const userData = await User.findById(req.session.userId);

    const file = comment.files;
    for (i of file) {
      let deleteFile = await deleteFileFromS3(i.file);
    }
    // comment.files.forEach(file => {
    //   const filePath = path.join(__dirname, '..', 'uploads', file.file);
    //   fs.unlink(filePath, err => {
    //     if (err) {
    //       console.error(`Error deleting file ${file.file}: `, err);
    //     }
    //   });
    // });

    await Comment.findByIdAndDelete(commentId);

    if (userData.role == "teacher") {
      res.redirect(`/adminIndex/eachLessons?lessonId=${lessonId}`)
    } else if (userData.role == "student") {
      res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`)
    }

  } catch (err) {
    console.log(err)
  }
}

const updateLessonProgress = async (req, res, next) => {
  // try {
  //   const { lessonId } = req.query;
  //   const userId = req.session.userId; // หรือจากข้อมูล session/ token
  //   const page = parseInt(req.query.page) || 1;
  //   // ตรวจสอบว่า lessonId และ page มีค่าหรือไม่
  //   if (!lessonId || !page) {
  //     return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  //   }

  //   // ค้นหาผู้ใช้และอัปเดตข้อมูลความคืบหน้า
  //   const user = await User.findById(userId);
  //   if (!user) {
  //     return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  //   }

  //   // อัปเดตความคืบหน้า (อาจจะเป็นการบันทึกหน้าแรกที่เข้าชม)
  //   user.lessonProgress = user.lessonProgress || {};
  //   user.lessonProgress[lessonId] = page;
  //   await user.save();

  //   next(); // ไปยัง middleware หรือ route handler ถัดไป
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  // }
};

const manageSubject = async (req, res) => {
  try {
    const subjectDbId = req.query.subjectDbId;
    const subject = await Subject.findById(subjectDbId)
      .populate({
        path: 'students',
        populate: {
          path: 'user'
        }
      })
      .populate('lessonArray')
      .exec();

    // console.log(subject);
    // console.log(subject);
    res.render("manageEachSubject", { subject });
    // res.json(subject);
  } catch (error) {
    console.log(error);
  }
}

const addStudentToSubject = async (req, res) => {
  try {
    const subjectDbId = req.query.subjectDbId;
    const findSubject = await Subject.findById(subjectDbId);

    const studentsNotInSubject = await Student.find({
      _id: { $nin: findSubject.students }
    }).populate('user');

    // res.json(studentsNotInSubject);
    res.render('addStudentToSubject', {
      subject: findSubject,
      studentsNotInSubject
    });
  } catch (err) {
    console.log(err);
  }
}

const deleteStudentFromSubjectPage = async (req, res) => {
  try {
    const subjectDbId = req.query.subjectDbId;
    const findSubject = await Subject.findById(subjectDbId)
      .populate({
        path: 'students',
        populate: {
          path: "user"
        }

      });

    // const studentsNotInSubject = await Student.find({
    //   _id: { $nin: findSubject.students }
    // }).populate('user');

    // res.json(studentsNotInSubject);
    res.render('deleteStudentFromSubject', {
      subject: findSubject,
      studentInSubject: findSubject.students
    });
  } catch (err) {
    console.log(err);
  }
}

const deleteSubject = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;

    await Student.updateMany(
      { 'subjects.subjectMongooseId': subjectId },  // เงื่อนไขในการค้นหา
      { $pull: { subjects: { subjectMongooseId: subjectId } } }  // ลบ subject ออกจาก array
    );
    
    const lessons = await Lesson.find({ 'subject.subjectMongooseId': subjectId });

    for (i of lessons) {
      const deleteLayout01 = i.LayOut1ArrayObject;
      const deleteLayout02 = i.LayOut2ArrayObject;
      const deleteLayout03 = i.LayOut3ArrayObject;
      const deleteLayout04 = i.LayOut4ArrayObject;
      const deletePdfFiles = i.PdfFiles;
      const textEditors = i.TextEditors;

      async function deleteLayouts(deleteLayouts, Layout) {
        if (deleteLayouts.length > 0) {

          for (const layoutId of deleteLayouts) {
            let findLayout = await Layout.findById(layoutId);
            if (findLayout) {
              if (findLayout.name == 'Layout01') {
                var layoutFile = findLayout.AboutImage[0].file;
                // console.log(layoutFile);

                // var filePath = path.join(__dirname, '../uploads', layoutFile); // สร้าง path ของไฟล์
                // unlinkFile(filePath);

                var deleteFile = await deleteFileFromS3(layoutFile);
              } else if (findLayout.name == 'pdfFiles') {
                var layoutFile = findLayout.file;
                // var filePath = path.join(__dirname, '../uploads', layoutFile); // สร้าง path ของไฟล์
                // unlinkFile(filePath);
                var deleteFile = await deleteFileFromS3(layoutFile);

              }
              const deletedLayout = await Layout.findByIdAndDelete(layoutId);
            }

          }
        }
      }
      // เรียกใช้ฟังก์ชั่น deleteLayouts สำหรับแต่ละประเภทของ Layout
      await deleteLayouts(deleteLayout01, Layout1);
      await deleteLayouts(deleteLayout02, Layout2);
      await deleteLayouts(deleteLayout03, Layout3);
      await deleteLayouts(deleteLayout04, Layout4);
      await deleteLayouts(deletePdfFiles, PdfFile);
      await deleteLayouts(textEditors, TextEditor);

    }

    await Lesson.deleteMany(
      { 'subject.subjectMongooseId': subjectId },
    );

    const assignments = await Assignment.find({ subject: subjectId });

    for (x of assignments) {
      const assign = await Assignment.findById(x._id);

      const files = assign.files;
      // res.json(files);
      for (const i of files) {
        // var filePath = path.join(__dirname, '../uploads', i.file); // สร้าง path ของไฟล์

        // unlinkFile(filePath)
        await deleteFileFromS3(i.file)
          .then(() => {
            return Assignment.findByIdAndUpdate(getAssignId, {
              $pull: {
                files: { _id: i._id }
              }
            });
          })
      }
    }

    await Assignment.deleteMany(
      { subject: subjectId },
    );
    
    await Subject.deleteOne({ _id: subjectId });

    res.redirect('/adminIndex/adminLessonIndex');
  } catch (err){
    console.log(err);
  }
}

const chooseSubject = async (req, res) => {
  try {

    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 } // เรียงลำดับจากใหม่ไปเก่า
    };

    const allSubjects = await Subject.paginate({}, options);
    res.render('chooseSubject', { allSubjects });
    // res.json(allSubjects);
  } catch (err) {
    console.log(err);
  }
}

const subjectCreateAssignment = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    const findSubject = await Subject.findById(subjectId)
    res.render('subjectCreateAssignment', { subjectId, findSubject });
  } catch (err) {
    console.log(err);
  }
}

const downloadFile = async (req, res) => {
  const fileName = 'Teach_stdlistExcel.xls'; // ชื่อไฟล์ที่ต้องการดาวน์โหลด
  const directoryPath = path.join(__dirname, '..', 'uploads', 'example_file'); // พาธของโฟลเดอร์ที่เก็บไฟล์
  const filePath = path.join(directoryPath, fileName);

  // ส่งไฟล์ไปยังคลายน์
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    }
  });
}

const setPermission = async (req, res) => {
  try {
    // const students = await Student.find().populate('user').sort({createdAt:1});
    const { page = 1, limit = 25 } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: 1 }, // เรียงลำดับจากใหม่ไปเก่า
      populate: 'user',
    };

    const students = await Student.paginate({}, options);
    // res.json(studentsNotInSubject);
    res.render('adminSetPermission', {
      students
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }

}

const addEndChapterQuestion = async (req, res) => {
  try {
    const lessonId = req.query.lesson;
    const lesson = await Lesson.findById(lessonId).populate("schoolYear");

    res.render("addEndChapterQuestion", { mytitle: "addEndChapterQuestion", lesson });
    // res.json(lesson);

  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};

const editEndQuestionChapter = async (req, res) => {
  try {
    const questionId = req.body.questionId;

    // ดึงข้อมูล lessonQuestion จาก database โดยใช้ questionId
    let lessonQuestionData = await lessonQuestion.findById(questionId);
    if (!lessonQuestionData) {
      return res.status(404).send('Lesson Question not found');
    }

    // วนลูปเพื่อจัดการคำถามจากฐานข้อมูล
    for (const question of lessonQuestionData.Questions) {
      let questionNo = question.questionNo; // เลขของคำถาม

      // ตรวจสอบว่ามีการทำเครื่องหมายลบคำถามหรือไม่
      if (req.body[`questionCheckDelete${questionNo}`] === 'on') {
        // ถ้าถูกทำเครื่องหมายให้ลบ ก็ให้ลบคำถามนี้ออกจาก database โดยใช้ pull
        await lessonQuestion.updateOne(
          { _id: questionId },
          { $pull: { Questions: { questionNo: questionNo } } }
        );
      } else if (req.body[`question${questionNo}`]) {
        // ถ้าไม่ถูกลบ ให้ตรวจสอบว่ามีการอัปเดตข้อความคำถามหรือไม่
        await lessonQuestion.updateOne(
          { _id: questionId, 'Questions.questionNo': questionNo },
          { $set: { 'Questions.$.questionText': req.body[`question${questionNo}`] } }
        );
      }
    }

    const checkLength = await lessonQuestion.findById(lessonQuestionData._id)
    if (checkLength.Questions.length < 1) {
      const daleteFromLesson = await Lesson.findByIdAndUpdate(
        { _id: checkLength.Lesson },
        {
          $pull: {
            lessonQuestion: checkLength._id
          }
        },
        {
          new: true
        }
      )

      const deleteQuestion = await lessonQuestion.findByIdAndDelete(checkLength._id);
    }

    res.redirect(`/adminIndex/eachLessons?lessonId=${checkLength.Lesson}`)

    // res.json(req.body);
  } catch (err) {
    console.error(err);

  }
}

const studentAnswerEndChapterQuestions = async (req, res) => {
  try {
    const lessonQuestionId = req.body.lessonQuestionId;
    const lessonId = req.body.lessonId;
    let lessonQuestionData = await lessonQuestion.findById(lessonQuestionId);

    if (!lessonQuestionData) {
      return res.status(404).send('Lesson Question not found');
    }

    const checkExist = await StudentAnswer.findOne(
      {
        lessonQuestion: lessonQuestionId,
        user: req.session.userId
      }
    );
    // let userId = req.session.userId;
    if (checkExist) {
      for (const question of lessonQuestionData.Questions) {
        let questionNo = question.questionNo; // เลขของคำถาม

        // ตรวจสอบว่ามีการทำเครื่องหมายลบคำถามหรือไม่
        if (req.body[`question${questionNo}`] != "") {

          // ถ้าถูกทำเครื่องหมายให้ลบ ก็ให้ลบคำถามนี้ออกจาก database โดยใช้ pull
          await StudentAnswer.updateOne(
            {
              _id: checkExist._id,
              'Questions.questionNo': questionNo
            },
            { $set: { 'Questions.$.questionText': req.body[`question${questionNo}`] } }
          );

        }
      }

    } else if (!checkExist) {
      let newStudentAnswer = new StudentAnswer({
        lessonQuestion: lessonQuestionId,
        user: req.session.userId
      })
      await newStudentAnswer.save();

      // วนลูปเพื่อจัดการคำถามจากฐานข้อมูล
      for (const question of lessonQuestionData.Questions) {
        let questionNo = question.questionNo; // เลขของคำถาม

        // ตรวจสอบว่ามีการทำเครื่องหมายลบคำถามหรือไม่
        if (req.body[`question${questionNo}`] != "") {

          let question = {
            questionNo: questionNo,
            questionText: req.body[`question1${questionNo}`]
          }
          // ถ้าถูกทำเครื่องหมายให้ลบ ก็ให้ลบคำถามนี้ออกจาก database โดยใช้ pull
          await StudentAnswer.updateOne(
            { _id: newStudentAnswer._id },
            { $push: { Questions: question } }
          );
        }
      }
    }
    res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`)
    // res.json(req.body);
  } catch (err) {
    console.log(err);
  }
}

const studentEditAnswerEndChapter = async (req, res) => {
  try {
    const studentAnswerId = req.body.studentAnswerId;
    const lessonId = req.body.lessonId;
    let StudentAnswerData = await StudentAnswer.findById(studentAnswerId);

    if (!StudentAnswerData) {
      return res.status(404).send('Lesson Question not found');
    } else if (StudentAnswerData) {
      for (const question of StudentAnswerData.Questions) {
        let questionNo = question.questionNo; // เลขของคำถาม

        // ตรวจสอบว่ามีการทำเครื่องหมายลบคำถามหรือไม่
        if (req.body[`question${questionNo}`] != "") {

          await StudentAnswer.updateOne(
            {
              _id: StudentAnswerData._id,
              'Questions.questionNo': questionNo
            },
            { $set: { 'Questions.$.questionText': req.body[`question${questionNo}`] } }
          );
        }
      }
    }
    res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`)
    // res.json(req.body);
  } catch (err) {
    console.log(err);
  }
}

const replyComment = async (req, res) => {
  try {
    const { commentId, replyMainComment, lessonId } = req.body;
    const userWhoComments = req.session.userId;
    const findUser = await User.findById(userWhoComments);
    const commentObject = {
      content: replyMainComment,
      user: userWhoComments,

    }
    const updateComment = await Comment.findByIdAndUpdate(
      { _id: commentId },
      {
        $push: { replies: commentObject }
      },
      {
        new: true
      }
    )

    if (findUser.role == 'teacher') {
      res.redirect(`/adminIndex/eachLessons?lessonId=${lessonId}`)

    } else if (findUser.role == 'student') {
      res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`)

    }
  } catch (err) {
    console.log(err);
  }
}

const editReplyComment = async (req, res) => {
  try {
    const { commentId, userId, lessonId, commentContent, oldCOntent, date } = req.body;
    // console.log(req.body);
    // const setNewDate = new Date(createdAt);
    // console.log(createdAt);
    // console.log(typeof createdAt);
    // console.log(setNewDate);
    // console.log(typeof setNewDate);
    // console.log(date);
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // const comments = await Comment.find({
    //   "replies.createdAt": { $gte: startOfDay, $lte: endOfDay }
    // }).populate('user'); // Populate ข้อมูลผู้ใช้

    // res.json(comments);
    const updatedComment = await Comment.findOneAndUpdate(
      {
        _id: commentId,
        "replies.createdAt": { $gte: startOfDay, $lte: endOfDay }
      },
      {
        $set: {
          "replies.$.content": commentContent // ใช้ $ เพื่ออัปเดต reply ที่ตรงเงื่อนไข
        }
      },
      { new: true } // คืนค่าใหม่หลังอัปเดตสำเร็จ
    );

    // console.log(updatedComment);
    // console.log(commentId);
    const findUser = await User.findOne({ _id: userId });
    //    console.log(findUser);
    if (findUser.role == 'teacher') {
      res.redirect(`/adminIndex/eachLessons?lessonId=${lessonId}`)

    } else if (findUser.role == 'student') {
      res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`)

    }
  } catch (err) {
    console.log(err);
  }
}

const editLessonContent = async (req, res) => {
  try {
    const lessonId = req.query.lesson;
    const userData = await User.findById(req.session.userId);
    const lesson = await Lesson.findById(lessonId).populate('subject.subjectMongooseId').populate('lessonQuestion');
    const subject = lesson.subject.subjectMongooseId;
    const layout01 = lesson.LayOut1ArrayObject;
    const layout02 = lesson.LayOut2ArrayObject;
    const layout03 = lesson.LayOut3ArrayObject;
    const layout04 = lesson.LayOut4ArrayObject;
    const layout05 = lesson.LayOut5ArrayObject;
    const pdfFiles = lesson.PdfFiles;
    const textEditor = lesson.TextEditors;
    const foundLayouts = [];
    async function findLayoutsAndStoreData(deleteLayouts, Layout) {

      if (deleteLayouts.length > 0) {
        for (const layoutId of deleteLayouts) {
          const foundLayout = await Layout.findById(layoutId);
          if (foundLayout) {
            foundLayouts.push(foundLayout);
          }
        }
      }

      return foundLayouts;
    }

    const foundLayouts1 = await findLayoutsAndStoreData(layout01, Layout1);
    const foundLayouts2 = await findLayoutsAndStoreData(layout02, Layout2);
    const foundLayouts3 = await findLayoutsAndStoreData(layout03, Layout3);
    const foundLayouts4 = await findLayoutsAndStoreData(layout04, Layout4);
    const foundLayouts5 = await findLayoutsAndStoreData(layout05, Layout5);
    const foundPdfFiles = await findLayoutsAndStoreData(pdfFiles, PdfFile);
    const foundtextEditor = await findLayoutsAndStoreData(textEditor, TextEditor);


    foundLayouts.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      if (dateA < dateB) {
        return -1;
      } else if (dateA > dateB) {
        return 1;
      } else {
        return 0;
      }
    });

    const page = parseInt(req.query.page) || 1;
    const pageSize = 4; // จำนวนข้อมูลต่อหน้า
    // const paginatedLayouts = paginate(foundLayouts, pageSize, page);
    const totalPages = Math.ceil(foundLayouts.length / pageSize);

    // ตรวจสอบว่า paginate มีการนำเข้าและใช้งานถูกต้อง
    function paginate(array, pageSize, page) {
      return array.slice((page - 1) * pageSize, page * pageSize);
    }

    const paginatedLayouts = paginate(foundLayouts, pageSize, page);
    // res.json(foundLayouts);
    res.render("adminEdit", {
      lesson,
      subject,
      currentPage: page,
      paginatedLayouts,
      totalPages,
    });

  } catch (err) {
    console.log(err);
  }
}

const deleteReplyComment = async (req, res) => {
  try {
    const { _id, date, lessonId, userId } = req.query;

    // console.log('Comment ID:', _id);
    // console.log('Date:', date);
    // console.log('Lesson ID:', lessonId);

    // แปลงวันที่ให้เป็น ISO เพื่อป้องกันปัญหาช่วงเวลา
    const startOfDay = new Date(new Date(date).toISOString().slice(0, 10));
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // console.log('Start of Day:', startOfDay);
    // console.log('End of Day:', endOfDay);

    const result = await Comment.updateOne(
      {
        _id, // ID ของคอมเมนต์
        'replies.createdAt': { $gte: startOfDay, $lt: endOfDay },
        'replies.user': userId, // ตรวจสอบว่า userId ตรงกัน
      },
      {
        $pull: {
          replies: {
            createdAt: { $gte: startOfDay, $lt: endOfDay },
            user: userId, // ลบเฉพาะ reply ที่มี userId ตรงกัน
          },
        },
      }
    );


    // console.log('Update Result:', result);

    if (result.modifiedCount > 0) {
      const findUser = await User.findOne({ _id: req.session.userId });

      if (findUser.role === 'teacher') {
        res.redirect(`/adminIndex/eachLessons?lessonId=${lessonId}`);
      } else if (findUser.role === 'student') {
        res.redirect(`/studentIndex/eachLessonStudent?lessonId=${lessonId}`);
      }
    } else {
      res.status(404).json({ message: 'No replies found for the given date' });
    }

  } catch (err) {
    console.log('Error:', err);
    res.status(500).json({ message: 'An error occurred' });
  }
};

module.exports = {
  adminIndex,
  adminLessonIndex,
  adminExamsIndex,
  addLesson,
  createLayout,
  eachLessons,
  getEditLessonNamePage,
  editLessonName,
  manageStudent,
  uploadStudent,
  uploadStudent2,
  schoolYearRender,
  copyLessons,
  pdfDowload,
  showFile,
  notLoggedIn,
  logsFile,
  teacherNotification,
  createComment,
  editComment,
  makeEditComment,
  deleteComment,
  eachLessonStudent,
  editCommentStudent,
  updateLessonProgress,
  addSubject,
  createSubject,
  manageSubject,
  addStudentToSubject,
  deleteStudentFromSubjectPage,
  deleteSubject,
  chooseSubject,
  subjectCreateAssignment,
  downloadFile,
  setPermission,
  addEndChapterQuestion,
  editEndQuestionChapter,
  studentAnswerEndChapterQuestions,
  studentEditAnswerEndChapter,
  replyComment,
  editReplyComment,
  editSubject,
  updateSubject,
  updateLesson,
  editLessonContent,
  deleteReplyComment
}