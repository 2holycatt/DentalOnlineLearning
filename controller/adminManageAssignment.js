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


const assignmentIndex = async (req, res) => {
  try {
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
    res.render('assignmentIndex', { subjects });

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

const assignmentDetail = async (req, res) => {
  try {
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    const getAssignId = req.query.id;
    const assignment = await Assignments.findById(getAssignId).populate("subject");
    const getSubmitDetail = await Assignments.findById(getAssignId)
      .populate({
        path: "submitDetail",
        populate: {
          path: "user",
          populate: {
            path: "student"
          }
        }
      });
    const formattedStartDate = moment(assignment.StartDate).format('DD/MM/YYYY hh:mm A');
    const formattedDeadline = moment(assignment.Deadline).format('DD/MM/YYYY hh:mm A');
    // const schoolYear = await SchoolYear.find();
    // const updatedFiles = assignment.files.map(filePath => {
    //   const { file } = filePath;
    //   const fileName = file.slice(33); // นำ string ตั้งแต่ตำแหน่งที่ 33 เป็นต้นไป
    //   return fileName;
    // });

    res.render('assignmentDetail', { assignment, formattedStartDate, formattedDeadline, getSubmitDetail });

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

const uploadAssignments = asyncWrapper(async (req, res) => {
  try {

    const { subjectId, name, Description, StartDate, Deadline, Score, schoolYear } = req.body;
    const files = req.files;
    // const checkExists = await SchoolYear.findOne({ schoolYear });
    const users = await User.find();
    const userData = await User.findById(req.session.userId);
    const subject = "การมอบหมายงานใหม่จาก Online Dentristy Learning";
    const whatCome = "มีงานที่มอบหมายใหม่เรื่อง";
    // console.log(files);
    // res.json(files);

    const saveAssign = new Assignments({
      name,
      Description,
      StartDate,
      Deadline,
      Score,
      subject: subjectId
    });

    const fileData = files.map(files => {
      return {
        file: files.filename,
        contentType: files.mimetype
      };
    });

    await saveAssign.save();
    const assignId = saveAssign._id;

    for (const i of fileData) {
      const updatedAssign = await Assignments.findByIdAndUpdate(
        assignId,
        { $push: { files: i } },
        { new: true }
      );
    }

    const addAssignId = await Subject.findByIdAndUpdate(
      subjectId,
      { $push: { Assignments: saveAssign._id } },
      { new: true }
    );

    await Promise.all(users.map(async user => {
      const findUser = await User.findById(user._id)
        .populate({
          path: "student",
          populate: {
            path: "schoolYear",
          }
        });
      // if (findUser.student && (findUser.student.schoolYear.schoolYear == checkExists.schoolYear)) {
      //   const email = user.email;
      //   sendEmail(email, subject, name, userData, whatCome);
      // }
    }));

    res.redirect('/adminIndex/assignmentIndex')

  } catch (error) {
    console.error(error);
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
    const filePath = path.join(__dirname, `../uploads/${getFilePath}`); // เส้นทางไฟล์
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
      (contentType === "image/jpeg")) 
    {
      if (userData.role == "teacher") {
        res.render('viewFilesAdmin', { fileName, contentType });
      } else if (userData.role == "student") {
        res.render('viewsFileStudent', { fileName, contentType });
      }
    } else {
      // Set content type header
      res.setHeader('Content-Type', `${contentType}`);

      const fileName = getFilePath.slice(25);
      // res.attachment(fileName);

      res.setHeader('Content-Disposition', 'inline; filename=' + fileName);

      // Send the file directly
      res.sendFile(filePath);
      // fs.createReadStream(filePath).pipe(res);
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
    const uploadsDir = path.resolve(__dirname, '..', 'uploads')

    const assign = await Assignments.findById(getAssignId);
    // const schoolYearId = assign.schoolYear._id;
    const fileNameToDelete = assign.files[getIndex].file;
    // const filePath = fileNameToDelete;
    const deletedFileId = assign.files[getIndex]._id;
    // const assignId = assign._id
    const filePath = path.join(uploadsDir, fileNameToDelete); // รวมเส้นทางโฟลเดอร์

    console.log(filePath);
    // ลบไฟล์
    unlinkFile(filePath)
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
        file: files.filename,
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
  const assign = await Assignments.findById(getAssignId);

  const files = assign.files;
  // res.json(files);
  for (const i of files) {
    var filePath = path.join(__dirname, '../uploads', i.file); // สร้าง path ของไฟล์

    unlinkFile(filePath)
      .then(() => {
        return Assignments.findByIdAndUpdate(getAssignId, {
          $pull: {
            files: { _id: i._id }
          }
        });
      })
  }

  const deleteAssign = await Assignments.findByIdAndDelete(getAssignId);
  res.redirect('/adminIndex/assignmentIndex');
};

const submitDetail = async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    const getAssignId = req.query.id;
    const submitId = req.query.submitId;
    const assignment = await Assignments.findById(getAssignId).populate("schoolYear");;
    const formattedStartDate = moment(assignment.StartDate).format('DD/MM/YYYY hh:mm A');
    const formattedDeadline = moment(assignment.Deadline).format('DD/MM/YYYY hh:mm A');
    const schoolYear = await SchoolYear.find();
    const updatedFiles = assignment.files.map(filePath => {
      const { file } = filePath;
      const fileName = file.slice(33); // นำ string ตั้งแต่ตำแหน่งที่ 33 เป็นต้นไป
      return fileName;
    });

    const getSubmitDetail = await submitAssign.findById(submitId)
      .populate({
        path: "user",
        populate: {
          path: "student",
        }
      });

    res.render('submitDetail', { schoolYear, lessons, assignment, updatedFiles, formattedStartDate, formattedDeadline, getSubmitDetail });

  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

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
  viewfiles
}