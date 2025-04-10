var User = require('../models/user.model')
var Student = require('../models/student.model')
const Lesson = require("../models/Lessons");
const Assignments = require("../models/Assignments");
const SchoolYear = require("../models/schoolYear");
const submitAssign = require("../models/submitAssignDetail");
const path = require('path');
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const Subject = require("../models/subjects");


const { deleteFileFromS3 } = require('../utils/s3Utils');

const moment = require('moment');

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

const studentAssignDetail = async (req, res) => {
    try {
        const getAssignId = req.query.id;
        const userData = await User.findById(req.session.userId);
        const navSubjects = await getSubjectsForNav(req.session.userId);
        const theme = req.session.theme || 'light';
        const isSidebarOpen = false;
        const assignment = await Assignments.findById(getAssignId)
         .populate({
            path: 'subject',
            select: 'subjectId subjectName section semester'
        });      
        const formattedStartDate = moment(assignment.StartDate).format('DD/MM/YYYY hh:mm A');
        const formattedDeadline = moment(assignment.Deadline).format('DD/MM/YYYY hh:mm A');
        
        const userSubmit = await submitAssign.findOne({ user: req.session.userId, assignment: getAssignId });
        // console.log(req.session.userId);
        // console.log(getAssignId);
        // console.log(userSubmit);
        res.render('studentAssignDetail', { assignment, formattedStartDate, formattedDeadline, userData ,navSubjects ,userSubmit , subject: assignment.subject ,theme, isSidebarOpen });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

const submitAssignment = async (req, res) => {
    try {
        const getAssignId = req.body.assignId;
        const userId = req.body.userId;
        const comment = req.body.comment;
        const files = req.files;

        const assignment = await Assignments.findById(getAssignId);
        const saveSubmit = new submitAssign({
            comment,
            user: userId,
            assignment: getAssignId,
        });
        await saveSubmit.save();
        // const filePaths = files.map(file => file.path);

        const fileData = files.map(files => {
            return {
                // file: files.filename,
                file: files.location,
                contentType: files.mimetype,
                originalName: files.originalname
            };
        });

        const getSendDate = new Date(saveSubmit.createdAt);
        const getDeadline = new Date(assignment.Deadline);

        const addSubmitAssignId = await User.findByIdAndUpdate(
            userId,
            {
                $push: { submitAssign: saveSubmit._id },
            },

            { new: true }
        );

        if (getSendDate > getDeadline) {
            const diffInMilliseconds = getSendDate - getDeadline; // สลับตำแหน่งเวลาที่คำนวณ
            const diffInSeconds = Math.floor(Math.abs(diffInMilliseconds) / 1000); // ใช้ค่าที่เป็นบวกในการคำนวณ
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            const diffInHours = Math.floor(diffInMinutes / 60);
            const diffInDays = Math.floor(diffInHours / 24);
            const remainingHours = diffInHours % 24;
            const remainingMinutes = diffInMinutes % 60;

            const status = "ส่งช้า"; // กำหนดสถานะตามเงื่อนไข

            const day = Math.abs(diffInDays); // ใช้ค่าที่เป็นบวกในการแสดงผล
            const hour = remainingHours;
            const minute = remainingMinutes;

            // console.log(`${status} ${day} วัน ${hour} ชั่วโมง ${minute} นาที`);
            if (files) {
                for (const i of fileData) {
                    const updatedAssign1 = await submitAssign.findByIdAndUpdate(
                        saveSubmit._id,
                        {
                            $push:
                            {
                                files: i,
                            },
                        },
                        { new: true }
                    );
                }
            }

            const updatedAssign2 = await submitAssign.findByIdAndUpdate(
                saveSubmit._id,
                {
                    $push:
                    {
                        sendStatus: {
                            status: status,
                            day: day,
                            hour: hour,
                            minute: minute

                        }
                    },
                },
                { new: true }
            );


            const pushSubmitId = await Assignments.findByIdAndUpdate(
                getAssignId,
                {
                    $push: { submitDetail: saveSubmit._id },
                    $inc: { sentCount: 1 }
                },
                { new: true }
            );
            // console.log(`ส่งไม่ตรงเวลา ${diffInDays} วัน ${remainingHours} ชั่วโมง ${remainingMinutes} นาที`);
        } else if (getSendDate < getDeadline) {
            const status = "ส่งตรงเวลา"
            if (files) {
                for (const i of fileData) {
                    const updatedAssign3 = await submitAssign.findByIdAndUpdate(
                        saveSubmit._id,
                        {
                            $push:
                            {
                                files: i,
                            },
                        },

                        { new: true }
                    );
                }
            }

            const updatedAssign4 = await submitAssign.findByIdAndUpdate(
                saveSubmit._id,
                {
                    $push:
                    {
                        sendStatus: {
                            status: status,
                        }
                    },
                },
                { new: true }
            );


            const pushSubmitId = await Assignments.findByIdAndUpdate(
                getAssignId,
                {
                    $push: { submitDetail: saveSubmit._id },
                    $inc: { sentCount: 1 }
                },
                { new: true }
            );
        }

        res.redirect(`/studentAssignDetail?id=${getAssignId}`);

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

const studentEditAssignment = async (req, res) => {
    try {
        const { assignId, submitAssignId, comment } = req.body;
        const files = req.files;

        const updatedSubmitAssign = await submitAssign.findByIdAndUpdate(
            submitAssignId,
            {
                comment
            },
            { new: true }
        );

        const fileData = files.map(files => {
            return {
                file: files.location,
                contentType: files.mimetype,
                originalName: files.originalname
            };
        });
        for (const i of fileData) {

            const updatedSubmitAssign = await submitAssign.findByIdAndUpdate(
                submitAssignId,
                { $push: { files: i } },
                { new: true }
            );
        }

        res.redirect(`/studentAssignDetail?id=${assignId}`);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving file');
    }
}

const delStudentFile = async (req, res) => {
    try {
        const submitAssignId = req.query.submitAssignId;
        const getIndex = req.query.fileIndex;
        const getSubmitAssign = await submitAssign.findById(submitAssignId).populate("assignment");
        //   const schoolYearId = assign.schoolYear._id;
        const fileNameToDelete = getSubmitAssign.files[getIndex].file;
        const filePath = fileNameToDelete;
        const deletedFileId = getSubmitAssign.files[getIndex]._id;
        const assignId = getSubmitAssign.assignment._id
        //    await deleteFileFromS3(filePath)

        // ลบไฟล์
        // unlinkFile(filePath)
        await deleteFileFromS3(filePath)
            .then(() => {
                console.log('File deleted successfully');
                return submitAssign.findByIdAndUpdate(submitAssignId, {
                    $pull: {
                        files: { _id: deletedFileId }
                    }
                });
            })
            .then(() => {
                console.log('File object deleted from MongoDB successfully');
                res.redirect(`/studentAssignDetail?id=${assignId}`);

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

const historyAssignment = async (req, res) => {
    try {
        const userData = await User.findById(req.session.userId)
            .populate({
                path: 'submitAssign',
                populate: {
                    path: 'assignment', // ดึง Assignment ที่เชื่อมกับ submitAssign
                }
            })
            .populate('student'); // ถ้าต้องการข้อมูล student ด้วย

        const assignmentArray = userData.submitAssign;

        // for (const i of getAssignment) {
        //     const getSubmitDetails = await submitAssign.findById(i).populate('assignment');
        //     assignmentArray.push(getSubmitDetails);
        // }
        // const getUserLessons = userData.student.schoolYear.lessonArray;
        res.render("historyAssignment", { userData, assignmentArray });
    } catch (error) {
        console.error(error);
    }
}

const studentCancelAssign = async (req, res) => {
    try {
        const submitId = req.query.submitId;
        const assignId = req.query.assignmentId;
        
        // 1. ลบไฟล์จาก S3 
        const findSubmitAssign = await submitAssign.findById(submitId);
        if (findSubmitAssign && findSubmitAssign.files) {
            for (const file of findSubmitAssign.files) {
                if (file.file) {
                    try {
                        await deleteFileFromS3(file.file);
                    } catch (error) {
                        console.error('Error deleting file from S3:', error);
                    }
                }
            }
        }

        // 2. อัพเดท Assignment
        await Assignments.findByIdAndUpdate(
            assignId,
            {
                $pull: { submitDetail: submitId },
                $inc: { sentCount: -1 }
            }
        );

        // 3. ลบ submitAssign
        await submitAssign.findByIdAndDelete(submitId);

        // 4. Redirect กลับไปที่หน้ารายละเอียดงาน
        return res.redirect(`/studentAssignDetail?id=${assignId}`);

    } catch (err) {
        console.error('Error in studentCancelAssign:', err);
        return res.status(500).json({ 
            error: 'เกิดข้อผิดพลาดในการยกเลิกการส่งงาน',
            details: err.message 
        });
    }
};
module.exports = {
    studentAssignDetail,
    submitAssignment,
    studentEditAssignment,
    delStudentFile,
    historyAssignment,
    studentCancelAssign

}
