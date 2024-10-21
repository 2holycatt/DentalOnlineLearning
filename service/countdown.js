const nodeCron = require('node-cron');
const nodemailer = require('nodemailer');
// const Assignments = require("../models/Assignments");
const Assignments = require('../models/Assignments'); // Assignment model
const SubmitAssign = require('../models/submitAssignDetail'); // submitAssign model
const User = require('../models/user.model'); // User model
const Subject = require('../models/subjects');
const Student = require('../models/student.model');
const moment = require('moment-timezone');

const formatDeadline = (timestamp) => {
    return moment(timestamp).tz('Asia/Bangkok').format('dddd, DD/MM/YYYY HH:mm:ss');
};

// const User = require('../models/user.model'); // User model
// ตั้งค่า Nodemailer
// ตั้งค่า Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'papinwit.s@kkumail.com',
        pass: 'akid mrnc zrey xzrd'
    }
});

const sendEmail = (email, assignmentName, deadline) => {
    const mailOptions = {
        from: 'papinwit.s@kkumail.com',
        to: email,
        subject: `แจ้งเตือนเวลาหมดเขตส่งงานที่มอบหมาย: ${assignmentName}`,
        text: `คุณมีงานที่มอบหมาย กำลังจะครบกำหนดในไม่ช้า ในวัน ${deadline} กรุณาตรวจสอบและส่งงานทันที`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

const sendDeadlineReminders = async () => {
    try {
        const now = new Date();
        // const oneDayInMs = 24 * 60 * 60 * 1000; // 1 วันในมิลลิวินาที
        // หา assignments ที่ใกล้หมดกำหนด

        // const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 วันในมิลลิวินาที
        // if (timeLeft <= oneDayInMs && timeLeft > oneDayInMs - (2 * 60 * 60 * 1000))
        // if (timeLeft <= threeDaysInMs && timeLeft > threeDaysInMs - (2 * 60 * 60 * 1000))

        // const fifteenMinutesInMs = 15 * 60 * 1000; // 15 นาที
        // const fiveMinutesInMs = 5 * 60 * 1000; // 5 นาที


        const assignments = await Assignments.find({
            Deadline: { $gte: now },
        }).populate('subject');

        for (const assignment of assignments) {
            const deadline = new Date(assignment.Deadline);
            const timeLeft = (deadline - now) / (1000 * 60); // เหลือเวลากี่นาที

            if (timeLeft <= 15 || timeLeft <= 5) {
                // หา subject ที่เชื่อมโยงกับ assignment
                const subject = await Subject.findById(assignment.subject).populate('students');

                for (const studentRef of subject.students) {
                    const student = await Student.findById(studentRef).populate('user');
                    const user = student.user;

                    // ตรวจสอบว่ามีการส่งงานหรือยัง
                    const submitted = await SubmitAssign.findOne({
                        assignment: assignment._id,
                        user: user._id,
                    });

                    const deadline = assignment.Deadline;
                    if (!submitted) {
                        console.log(`นักศึกษายังไม่ส่งงาน ${assignment.name}. เหลือเวลา: ${timeLeft} นาที`);

                        sendEmail(user.email, assignment.name, formatDeadline(deadline));
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking assignments:', error);
    }
};

// nodeCron.schedule('* * * * *', sendDeadlineReminders);
nodeCron.schedule('0 0 * * *', sendDeadlineReminders, {
    timezone: 'Asia/Bangkok',
});

module.exports = { sendDeadlineReminders };
