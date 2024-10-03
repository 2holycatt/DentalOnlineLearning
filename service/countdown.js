// const nodeCron = require('node-cron');
// const nodemailer = require('nodemailer');
// const Assignments = require("../models/Assignments");

// // ตั้งค่า Nodemailer
// // const transporter = nodemailer.createTransport({
// //     service: 'gmail',
// //     auth: {
// //         user: 'papinwit.s@kkumail.com',
// //         pass: 'akid mrnc zrey xzrd'
// //     }
// // });

// // async function sendDeadlineReminders() {
// //     try {
// //         // หา Assignment ที่กำหนดส่งในอีก 3 วันหรือ 1 วัน
// //         const today = new Date();
// //         const threeDaysLater = new Date(today);
// //         const oneDayLater = new Date(today);
        
// //         threeDaysLater.setDate(today.getDate() + 3);
// //         oneDayLater.setDate(today.getDate() + 1);

// //         const assignments = await Assignments.find({
// //             Deadline: {
// //                 $in: [threeDaysLater, oneDayLater]
// //             }
// //         }).populate({
// //             path: 'subject',
// //             populate: {
// //                 path: 'students',
// //                 populate: {
// //                     path: 'user', // สมมติว่า student มี field ชื่อ 'user' ที่อ้างอิงไปยังโมเดล User
// //                 }
// //             }
// //         });

// //         for (const assignment of assignments) {
// //             const subject = assignment.subject;
// //             const students = subject.students;

// //             for (const student of students) {
// //                 const email = student.user.email;
// //                 const studentInfo = student.user;
// //                 const daysLeft = (assignment.Deadline.toDateString() === threeDaysLater.toDateString()) ? 3 : 1;

// //                 if (email.includes('@')) {
// //                     // ส่งอีเมลแจ้งเตือน
// //                     let info = await transporter.sendMail({
// //                         from: 'papinwit.s@kkumail.com',
// //                         to: email,
// //                         subject: `Reminder: ${assignment.name} is due in ${daysLeft} day(s)`,
// //                         html: `
// //                             <p>Dear ${studentInfo.name},</p>
// //                             <p>This is a reminder that the assignment <strong>${assignment.name}</strong> is due in ${daysLeft} day(s).</p>
// //                             <p>Please make sure to submit it on time.</p>
// //                         `
// //                     });

// //                     console.log('Reminder sent to %s: %s', email, info.messageId);
// //                 }
// //             }
// //         }
// //     } catch (error) {
// //         console.error('Error sending reminders:', error);
// //     }
// // }

// // async function sendDeadlineReminders() {
// //     console.log('Cron job started'); // เพิ่มการแจ้งเตือนนี้
// //     try {
// //         // โค้ดเดิม...
// //     } catch (error) {
// //         console.error('Error sending reminders:', error);
// //     }
// // }

// // ตั้ง cron job เพื่อรันฟังก์ชันนี้ทุกวันตอนเที่ยงคืน

// nodeCron.schedule('*/1 * * * *', () => {
//     console.log('Cron job is working every 1 minutes');
// });

// // nodeCron.schedule('3 16 * * *', sendDeadlineReminders);

// module.exports = { sendDeadlineReminders };
