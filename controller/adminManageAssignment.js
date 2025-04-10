const Assignments = require("../models/Assignments");
const submitAssign = require("../models/submitAssignDetail");
const asyncWrapper = require("../middleware/asyncWrapper");
const Lesson = require("../models/Lessons");
const Student = require("../models/student.model");
const Subject = require("../models/subjects");
const User = require("../models/user.model");
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const SchoolYear = require("../models/schoolYear");
const { sendEmail } = require('../service/notification');
// const IronPdf = require('@ironsoftware/ironpdf');
const fetch = require('node-fetch');

const { deleteFileFromS3 } = require('../utils/s3Utils');


async function getSubjectsForNav(userId) {
  const userData = await User.findById(userId);
  let subject;
  
  if (userData.role === 'student') {
    const studentData = await Student.findOne({ user: userId })
      .populate('subjects.subjectMongooseId');
    subject = studentData.subjects.map(subject => subject.subjectMongooseId);
  } else {
    subject = await Subject.find()
      .sort({ semester: 1 })
      .populate("lessonArray");
  }
  
  return subject;
}

const assignmentIndex = async (req, res) => {
  try {
    const userData = await User.findById(req.session.userId);
    const subjects = await Subject.find().populate('Assignments').sort({ createdAt: 1 }).exec();
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    // const schoolYear = await SchoolYear.find();
    // สร้างฟังก์ชันสำหรับการแปลงวันที่ในแต่ละ object ในอาร์เรย์
    // const formatAssignmentDates = (assignment) => {
    //   return assignment.map(assignment => {
    //     console.log(assignment);
    //     const formattedStartDate = moment(assignment.StartDate).format('DD/MM/YYYY hh:mm A');
    //     const formattedDeadline = moment(assignment.Deadline).format('DD/MM/YYYY hh:mm A');

    //     return {
    //       ...assignment,
    //       StartDate: formattedStartDate,
    //       Deadline: formattedDeadline
    //     };
    //   });
    // };
    // const assignments = await Assignments.find().populate("schoolYear").sort({ createdAt: 1 }).exec();
    // const formattedAssignments = formatAssignmentDates(subeject.Assignments);
    const navSubjects = await getSubjectsForNav(req.session.userId);
    const theme = req.session.theme || 'light'; 
    const isSidebarOpen = false; 
    subjects.forEach(subject => {
      subject.Assignments.forEach(assignment => {
        assignment._doc.formattedStartDate = moment(assignment.StartDate).format('DD/MM/YYYY hh:mm A');
        assignment._doc.formattedDeadline = moment(assignment.Deadline).format('DD/MM/YYYY hh:mm A');
      });
    });

    // res.json(subjects);
    //ใช้ตอนแสดงผล
    // const getStartTimeMoment12h = moment(getStartTime).format('DD/MM/YYYY hh:mm A');
    // const getEndTimeMoment12h = moment(getendTime).format('DD/MM/YYYY hh:mm A');
    res.render('assignmentIndex', { subjects ,navSubjects , theme, isSidebarOpen , userData});

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

const assignmentDetail = async (req, res) => {
  try {
    const assignId = req.query.id;
    const assignment = await Assignments.findById(assignId)
      .populate({
        path: 'subject',
        select: 'subjectId subjectName semester section'
      })
      .populate({
        path: 'submitDetail',
        populate: [{
          path: 'user',
          model: 'User',
          select: 'fname lname email'
        }]
      });

    if (!assignment) {
      return res.status(404).send('Assignment not found');
    }

    // Format dates
    const formattedDates = {
      startDate: moment(assignment.StartDate).format('DD/MM/YYYY HH:mm'),
      deadline: moment(assignment.Deadline).format('DD/MM/YYYY HH:mm'),
      startDateInput: moment(assignment.StartDate).format('YYYY-MM-DDTHH:mm'),
      deadlineInput: moment(assignment.Deadline).format('YYYY-MM-DDTHH:mm')
    };

    // Format files
    const formattedFiles = (assignment.files || []).map(file => {
      const fileData = file.toObject ? file.toObject() : file;
      const filePath = fileData.file || '';
      const fileName = fileData.originalName || (filePath ? filePath.split('/').pop() : 'ไม่พบชื่อไฟล์');

      return {
        ...fileData,
        displayUrl: filePath ? decodeURIComponent(filePath) : '',
        filename: decodeURIComponent(fileName),
        isImage: /\.(jpg|jpeg|png|gif)$/i.test(filePath),
        isPdf: /\.pdf$/i.test(filePath),
        isVideo: /\.(mp4|webm)$/i.test(filePath)
      };
    });

    // Format submit details
    const submitDetails = await Promise.all((assignment.submitDetail || []).map(async (detail) => {
      const student = await Student.findOne({ user: detail.user._id });
      
      const submittedDate = moment(detail.createdAt);
      const deadline = moment(assignment.Deadline);
      const sendStatus = submittedDate.isBefore(deadline) 
        ? { status: "ส่งตรงเวลา" }
        : {
            status: "ส่งช้า",
            day: Math.floor(moment.duration(submittedDate.diff(deadline)).asDays()),
            hour: moment.duration(submittedDate.diff(deadline)).hours(),
            minute: moment.duration(submittedDate.diff(deadline)).minutes()
          };

      return {
        ...detail.toObject(),
        studentId: student?.studentId || 'ไม่พบรหัสนักศึกษา',
        sendStatus,
        formattedDate: moment(detail.createdAt).format('DD/MM/YYYY HH:mm'),
        Score: detail.Score
      };
    }));

    // Render with all formatted data
    res.render('assignmentDetail', {
      assignment: {
        ...assignment.toObject(),
        files: formattedFiles,
        // Add these formatted dates to assignment object
        formattedStartDateInput: formattedDates.startDateInput,
        formattedDeadlineInput: formattedDates.deadlineInput
      },
      formattedStartDate: formattedDates.startDate,
      formattedDeadline: formattedDates.deadline,
      subject: assignment.subject,
      getSubmitDetail: {
        submitDetail: submitDetails
      },
      userData: await User.findById(req.session.userId),
      theme: req.session.theme || 'light',
      isSidebarOpen: false
    });

  } catch (error) {
    console.error('Assignment Detail Error:', error);
    res.status(500).send('Server Error');
  }
};

const uploadAssignments = asyncWrapper(async (req, res) => {
  try {
    const { subjectId, name, Description, StartDate, Deadline, Score } = req.body;
    const files = req.files;
   
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).send('Subject not found');
    }

    // สร้าง assignment ใหม่
    const saveAssign = new Assignments({
      name,
      Description,
      StartDate,
      Deadline,
      Score,
      subject: subject._id,
      files: files.map(file => ({
        file: file.location, // S3 path
        contentType: file.mimetype,
        originalName: file.originalname 
      }))
    });

    // บันทึก assignment
    await saveAssign.save();

    // อัพเดท subject โดยเพิ่ม reference ไปยัง assignment
    await Subject.findByIdAndUpdate(
      subject._id,
      { $push: { Assignments: saveAssign._id } },
      { new: true }
    );

    // ส่ง email notification (ถ้าต้องการ)
    const users = await User.find({ role: 'student' });
    const userData = await User.findById(req.session.userId);
    
    // if (users.length > 0) {
    //   const header = "การมอบหมายงานใหม่จาก Online Dentristy Learning";
    //   const whatCome = "มีงานที่มอบหมายใหม่เรื่อง";

    //   // ส่ง email แบบ Promise.all
    //   await Promise.all(users.map(async user => {
    //     try {
    //       const studentData = await Student.findOne({ user: user._id })
    //         .populate('subjects.subjectMongooseId');

    //       if (studentData && studentData.subjects.some(s => 
    //         s.subjectMongooseId && 
    //         s.subjectMongooseId._id.toString() === subject._id.toString()
    //       )) {
    //         await sendEmail(user.email, header, name, userData, whatCome);
    //       }
    //     } catch (err) {
    //       console.error(`Error sending email to ${user.email}:`, err);
    //     }
    //   }));
    // }

    // redirect กลับไปหน้า subject
    res.redirect(`/eachSubject?subjectDbId=${subject._id}`);

  } catch (error) {
    console.error('Upload Assignment Error:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการอัปโหลดและเขียนลงในฐานข้อมูล');
  }
});

const showFileArray = async (req, res) => {
  try {
    const assignId = req.query.id;
    const fileIndex = req.query.index;
    const assignment = await Assignments.findById(assignId);
    const getFiles = assignment.files[fileIndex];
    const contentType = getFiles.contentType;
    const fileName = getFiles.file
    const getFilePath = assignment.files[fileIndex].file;
    // const filePath = path.join(__dirname, `../uploads/${getFilePath}`); // เส้นทางไฟล์
    // const filePath = path.join(__dirname, `../uploads/${getFilePath}`); // เส้นทางไฟล์
    // const fileName = getFilePath.slice(33);

    // if (contentType == "application/pdf") {
    //   const pdfDocument = await IronPdf.PdfDocument.fromFile(filePath);
    //   const pdfBytes = await pdfDocument.toBuffer();
    //   res.setHeader('Content-Disposition', 'inline; filename=' + fileName);
    //   res.setHeader('Content-Type', 'application/pdf');

    //   res.sendFile(filePath);
    // } else {
    //   // Set content type header
    //   res.setHeader('Content-Type', `${contentType}`);

    //   const fileName = getFilePath.slice(33);
    //   // res.attachment(fileName);

    //   res.setHeader('Content-Disposition', 'inline; filename=' + fileName);

    //   // Send the file directly
    //   res.sendFile(filePath);
    //   // fs.createReadStream(filePath).pipe(res);
    // }
    const userData = await User.findById(req.session.userId);

    if ((contentType === "application/pdf") ||
      (contentType === "video/mp4") ||
      (contentType === "image/jpeg")) {
      if (userData.role == "teacher") {
        res.render('viewFilesAdmin', { fileName, contentType });
      } else if (userData.role == "student") {
        res.render('viewsFileStudent', { fileName, contentType });
      }
    } else {

      res.redirect(getFilePath);
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving file');
  }
}

const showFileArray2 = async (req, res) => {
  try {
    const assignId = req.query.id;
    const fileIndex = req.query.index;
    const assignment = await submitAssign.findById(assignId);
    const getFiles = assignment.files[fileIndex];
    const contentType = getFiles.contentType;
    const fileName = getFiles.file
    const getFilePath = assignment.files[fileIndex].file;
    // const filePath = path.join(__dirname, `../uploads/${getFilePath}`); // เส้นทางไฟล์
    // const filePath = path.join(__dirname, `../uploads/${getFilePath}`); // เส้นทางไฟล์
    // const fileName = getFilePath.slice(33);

    // if (contentType == "application/pdf") {
    //   const pdfDocument = await IronPdf.PdfDocument.fromFile(filePath);
    //   const pdfBytes = await pdfDocument.toBuffer();
    //   res.setHeader('Content-Disposition', 'inline; filename=' + fileName);
    //   res.setHeader('Content-Type', 'application/pdf');

    //   res.sendFile(filePath);
    // } else {
    //   // Set content type header
    //   res.setHeader('Content-Type', `${contentType}`);

    //   const fileName = getFilePath.slice(33);
    //   // res.attachment(fileName);

    //   res.setHeader('Content-Disposition', 'inline; filename=' + fileName);

    //   // Send the file directly
    //   res.sendFile(filePath);
    //   // fs.createReadStream(filePath).pipe(res);
    // }
    const userData = await User.findById(req.session.userId);

    if ((contentType === "application/pdf") ||
      (contentType === "video/mp4") ||
      (contentType === "image/jpeg")) {
      if (userData.role == "teacher") {
        res.render('viewFilesAdmin', { fileName, contentType });
      } else if (userData.role == "student") {
        res.render('viewsFileStudent', { fileName, contentType });
      }
    } else {

      res.redirect(getFilePath);
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving file');
  }
}

const delFile = async (req, res) => {
  try {
    const getAssignId = req.query.assignId;
    const getIndex = req.query.fileIndex;
    // const uploadsDir = path.resolve(__dirname, '..', 'uploads')

    const assign = await Assignments.findById(getAssignId);
    // const schoolYearId = assign.schoolYear._id;
    const fileNameToDelete = assign.files[getIndex].file;
    // const filePath = fileNameToDelete;
    const deletedFileId = assign.files[getIndex]._id;
    // const assignId = assign._id
    // const filePath = path.join(uploadsDir, fileNameToDelete); // รวมเส้นทางโฟลเดอร์

    // console.log(filePath);
    // ลบไฟล์
    // unlinkFile(filePath)
    await deleteFileFromS3(fileNameToDelete)
      .then(() => {
        console.log('File deleted successfully');
        return Assignments.findByIdAndUpdate(getAssignId, {
          $pull: {
            files: { _id: deletedFileId }
          }
        });
      })
      .then(() => {
        console.log('File object deleted from MongoDB successfully');
        res.redirect('/adminIndex/assignmentDetail?id=' + getAssignId);
        // ทำ process อื่น ๆ ต่อไปที่คุณต้องการ

      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error deleting file');
      });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving file');
  }
}

const delFileStudent = async (req, res) => {
  try {
    const getAssignId = req.query.assignId;
    const getIndex = req.query.fileIndex;
    // const uploadsDir = path.resolve(__dirname, '..', 'uploads')

    const assign = await submitAssign.findById(getAssignId);
    // const schoolYearId = assign.schoolYear._id;
    const fileNameToDelete = assign.files[getIndex].file;
    // const filePath = fileNameToDelete;
    const deletedFileId = assign.files[getIndex]._id;
    // const assignId = assign._id
    // const filePath = path.join(uploadsDir, fileNameToDelete); // รวมเส้นทางโฟลเดอร์

    // console.log(filePath);
    // ลบไฟล์
    // unlinkFile(filePath)
    await deleteFileFromS3(fileNameToDelete)
      .then(() => {
        console.log('File deleted successfully');
        return submitAssign.findByIdAndUpdate(getAssignId, {
          $pull: {
            files: { _id: deletedFileId }
          }
        });
      })
      .then(() => {
        console.log('File object deleted from MongoDB successfully');
        res.redirect('/studentAssignDetail?id=' + assign.assignment);
        // ทำ process อื่น ๆ ต่อไปที่คุณต้องการ

      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error deleting file');
      });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving file');
  }
}


const editAssign = async (req, res) => {
  try {
    const { assignId, name, Description, Score, StartDate, Deadline, schoolYear } = req.body;
    const getFiles = req.files;
    // const checkExists = await SchoolYear.findOne({ schoolYear });

    if (StartDate != "" || Deadline != "") {
      const updatedAssignment = await Assignments.findByIdAndUpdate(assignId, {
        name: name,
        Description: Description,
        Score: Score,
        StartDate: StartDate,
        Deadline: Deadline,
      },
        { new: true });
    } else if (StartDate == "" || Deadline == "") {
      const updatedAssignment = await Assignments.findByIdAndUpdate(assignId, {
        name: name,
        Description: Description,
        Score: Score,

      },
        { new: true });
    }

    const fileData = getFiles.map(files => {
      return {
        file: files.location,
        contentType: files.mimetype
      };
    });
    for (const i of fileData) {

      const updatedAssign = await Assignments.findByIdAndUpdate(
        assignId,
        { $push: { files: i } },
        { new: true }
      );
    }


    res.redirect('/adminIndex/assignmentDetail?id=' + assignId);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving file');
  }
}

const delAssign = async (req, res) => {
  const getAssignId = req.query.assignId;
  const assign = await Assignments.findById(getAssignId)
  .populate('subject');

  if (!assign) {
    return res.status(404).send('Assignment not found');
  }
  const subjectDbId = assign.subject._id; // Get subject ID from populated data
  const files = assign.files;
  // res.json(files);
  for (const i of files) {
    // var filePath = path.join(__dirname, '../uploads', i.file); // สร้าง path ของไฟล์

    // unlinkFile(filePath)
    await deleteFileFromS3(i.file)
      .then(() => {
        return Assignments.findByIdAndUpdate(getAssignId, {
          $pull: {
            files: { _id: i._id }
          }
        });
      })
  }

  const deleteAssign = await Assignments.findByIdAndDelete(getAssignId);
  res.redirect(`/eachSubject?subjectDbId=${subjectDbId}`);
};

const submitDetail = async (req, res) => {
  try {
    const { id: assignId, submitId } = req.query;

    // ดึงข้อมูล assignment และ submitDetail พร้อม populate ข้อมูลที่จำเป็น
    const [assignment, submitDetail] = await Promise.all([
      Assignments.findById(assignId),
      submitAssign.findById(submitId).populate({
        path: 'user',
        select: 'fname lname email',
        populate: {
          path: 'student',
          model: 'Student',
          select: 'studentId'
        }
      })
    ]);

    if (!submitDetail) {
      return res.status(404).send('Submit detail not found');
    }

    // ค้นหาข้อมูลนักศึกษาโดยตรง
    const student = await Student.findOne({ user: submitDetail.user._id });

    // คำนวณสถานะการส่ง
    const submittedDate = moment(submitDetail.createdAt);
    const deadline = moment(assignment.Deadline);
    const sendStatus = submittedDate.isBefore(deadline) 
      ? { 
          status: "ส่งตรงเวลา",
          day: 0,
          hour: 0,
          minute: 0
        }
      : {
          status: "ส่งช้า",
          day: Math.floor(moment.duration(submittedDate.diff(deadline)).asDays()),
          hour: moment.duration(submittedDate.diff(deadline)).hours(),
          minute: moment.duration(submittedDate.diff(deadline)).minutes()
        };

    // Format files data
    const formattedFiles = (submitDetail.files || []).map(file => {
      const fileData = file.toObject ? file.toObject() : file;
      return {
        ...fileData,
        displayUrl: decodeURIComponent(fileData.file || ''),
        filename: decodeURIComponent(fileData.originalName || fileData.file?.split('/').pop() || 'ไม่พบชื่อไฟล์'),
        isImage: /\.(jpg|jpeg|png|gif)$/i.test(fileData.file || '')
      };
    });

    // เตรียมข้อมูลสำหรับ view
    const studentData = {
      studentId: student?.studentId || submitDetail.user?.student?.studentId || 'ไม่พบรหัสนักศึกษา',
      fullName: `${submitDetail.user?.fname || ''} ${submitDetail.user?.lname || ''}`
    };

    // ส่งข้อมูลไป render
    res.render('submitDetail', {
      assignment,
      getSubmitDetail: {
        ...submitDetail.toObject(),
        sendStatus,
        files: formattedFiles,
        user: {
          ...submitDetail.user.toObject(),
          studentId: studentData.studentId // เพิ่ม studentId เข้าไปใน user object
        }
      },
      userData: await User.findById(req.session.userId),
      theme: req.session.theme || 'light',
      isSidebarOpen: false,
      studentData // ส่ง studentData แยก
    });

  } catch (error) {
    console.error('Submit Detail Error:', error);
    res.status(500).send('Server Error');
  }
};

const checkAssignment = async (req, res) => {
  try {
    const { assignId, submitId, teacherComment, Score } = req.body;
    const checkDate = new Date();
    const updatedSubmit = await submitAssign.findByIdAndUpdate(submitId, {
      teacherComment: teacherComment,
      Score: Score,
      checked: true,
      checkDate: checkDate
    },
      { new: true }
    );

    res.redirect(`/adminIndex/submitDetail?id=${assignId}&submitId=${submitId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

const checkEditAssignment = async (req, res) => {
  try {
    const { assignId, submitId, teacherComment, Score } = req.body;
    const checkDate = new Date();
    const updatedSubmit = await submitAssign.findByIdAndUpdate(submitId, {
      teacherComment: teacherComment,
      Score: Score,
      checkDate: checkDate
    },
      { new: true }
    );

    res.redirect(`/adminIndex/submitDetail?id=${assignId}&submitId=${submitId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

const viewfiles = async (req, res) => {
  try {
    const { assignId, fileIndex } = req.params;
    const assignment = await Assignments.findById(assignId);
    const getFiles = assignment.files[fileIndex];
    const contentType = getFiles.contentType;
    const getFilePath = assignment.files[fileIndex].file;
    const filePath = path.join(__dirname, `../uploads/${getFilePath}`);
    const fileName = getFilePath.slice(33);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline; filename=' + fileName);

    res.sendFile(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving file');
  }
};


module.exports = {
  uploadAssignments,
  assignmentIndex,
  assignmentDetail,
  showFileArray,
  delFile,
  editAssign,
  delAssign,
  submitDetail,
  checkAssignment,
  checkEditAssignment,
  viewfiles,
  delFileStudent,
  showFileArray2
}