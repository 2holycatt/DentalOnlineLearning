var express = require('express');
var router = express.Router();
const LoginController = require("../controller/Login");
const LogsFile = require("../controller/LogsFile");
const adminController = require("../controller/adminController");
const adminEditDelete = require("../controller/adminEditDeleteController");
const adminManageLayouts = require("../controller/adminManageLayouts");
const manageStudent = require("../controller/manageStudent");
const assignmentsController = require("../controller/adminManageAssignment");
const studentController = require("../controller/studentController");
const studentAssignment = require("../controller/studentAssignment");
const notification = require("../controller/notificationController");
const adminDashboard = require("../controller/adminDashboard");
const dashboardManagement = require("../controller/dashboardManagement");

// Middleware For Files Uploading
const upload = require("../middleware/multer");

// Middleware For Login System
const redirectIfAuth = require("../middleware/redirectIfAuth");
const studentMiddleware = require("../middleware/studentMiddleware");
const teacherMiddleware = require("../middleware/teacherMiddleware");

// Not Logged in Routes
router.get('/', redirectIfAuth, adminController.notLoggedIn);

// router.get('/login', redirectIfAuth, LoginController.ifNotLoggedIn);
// router.get('/logout', LoginController.logout);
router.get('/auth/google', redirectIfAuth, LoginController.authGoogle);
router.get('/auth/google/callback', LoginController.authGoogleCallback);
router.get('/logoutGoogle', LoginController.logoutGoogle);

// Login Process
// router.post('/loginToWeb', LoginController.loginPage);
router.post('/saveInfoStudent', LoginController.saveInfoStudent);

// Admin Center Router
router.get('/adminIndex', teacherMiddleware, adminController.adminIndex);
router.get('/adminIndex/adminLessonIndex', adminController.adminLessonIndex);
router.get('/adminIndex/manageStudent', teacherMiddleware, adminController.manageStudent);
// router.get('/adminIndex/uploadStudent', teacherMiddleware, adminController.uploadStudent);
// router.get('/adminIndex/uploadStudent2', teacherMiddleware, adminController.uploadStudent2);
router.get('/adminIndex/downloadFile', adminController.downloadFile);

router.get('/adminIndex/uploadStudent', adminController.uploadStudent);
router.get('/adminIndex/uploadStudent2', adminController.uploadStudent2);

router.get('/adminIndex/schoolYearRender', teacherMiddleware, adminController.schoolYearRender);
router.get('/adminIndex/addLesson', adminController.addLesson);
router.get('/adminIndex/addSubject', teacherMiddleware, adminController.addSubject);
router.get('/adminIndex/getEditLessonNamePage', teacherMiddleware, adminController.getEditLessonNamePage);
router.post('/adminIndex/editLessonName', adminController.editLessonName);
router.get('/adminIndex/pdfDowload', teacherMiddleware, adminController.pdfDowload);
router.get('/adminIndex/showFile', teacherMiddleware, adminController.showFile);

// router.post('/adminIndex/createLayout', adminController.createLayout);
const { createLayout } = require("../controller/adminController");
router.post('/adminIndex/createSubject', teacherMiddleware, adminController.createSubject);
router.route('/adminIndex/createLayout').post(upload.single("file"), createLayout);
router.get('/adminIndex/eachLessons', adminController.eachLessons)
router.get('/adminIndex/copyLessons', teacherMiddleware, adminController.copyLessons)
router.get('/adminIndex/manageSubject', adminController.manageSubject)
router.get('/adminIndex/logsFile', teacherMiddleware, adminController.logsFile)
router.get('/adminIndex/teacherNotification', teacherMiddleware, adminController.teacherNotification)
const {createComment, makeEditComment } = require("../controller/adminController");
router.route('/adminIndex/comment').post(upload.array("files"), createComment);
router.route('/studentIndex/comment').post(upload.array("files"), createComment);
router.get('/adminIndex/editComment', teacherMiddleware, adminController.editComment)
router.get('/studentIndex/editCommentStudent', studentMiddleware, adminController.editCommentStudent)
router.get('/adminIndex/deleteComment', teacherMiddleware, adminController.deleteComment)
router.get('/studentIndex/deleteComment', studentMiddleware, adminController.deleteComment)
router.route('/adminIndex/makeEditComment').post(upload.array("files"), makeEditComment);
router.route('/studentIndex/makeEditComment').post(upload.array("files"), makeEditComment);
router.get('/studentIndex/eachLessonStudent', studentMiddleware, adminController.eachLessonStudent)
router.get('/adminIndex/addStudentToSubject', adminController.addStudentToSubject);
router.get('/adminIndex/deleteStudentFromSubjectPage', adminController.deleteStudentFromSubjectPage);
router.get('/adminIndex/deleteSubject', adminController.deleteSubject);
router.get('/adminIndex/chooseSubject', adminController.chooseSubject);
router.get('/adminIndex/subjectCreateAssignment', adminController.subjectCreateAssignment);
router.get('/adminIndex/setPermission', adminController.setPermission);
router.get('/adminIndex/addEndChapterQuestion', adminController.addEndChapterQuestion);
// router.post('/adminIndex/makeEditComment', teacherMiddleware, adminController.makeEditComment)


//Admin Assignments Router
router.get('/adminIndex/showFileArray', teacherMiddleware, assignmentsController.showFileArray);
router.get('/adminIndex/assignmentIndex', assignmentsController.assignmentIndex);
router.get('/adminIndex/assignmentDetail', teacherMiddleware, assignmentsController.assignmentDetail);
router.get('/adminIndex/delFile', teacherMiddleware, assignmentsController.delFile);
router.get('/adminIndex/delAssign', teacherMiddleware, assignmentsController.delAssign);
router.get('/adminIndex/submitDetail', teacherMiddleware, assignmentsController.submitDetail);
router.post('/adminIndex/checkAssignment', assignmentsController.checkAssignment);
router.post('/adminIndex/checkEditAssignment', assignmentsController.checkEditAssignment);

const { uploadAssignments, editAssign } = require("../controller/adminManageAssignment");
router.route('/adminIndex/uploadAssignments').post(upload.array("file"), uploadAssignments);
router.route('/adminIndex/editAssign').post(upload.array("file"), editAssign);

//Admin Layout Manangement
const { createLayout_01, createLayout03, uploadPdfToLesson } = require("../controller/adminManageLayouts");
router.route('/adminIndex/createLayout_01').post(upload.single("file"), createLayout_01);
router.route('/adminIndex/uploadPdfToLesson').post(upload.array("pdf-file"), uploadPdfToLesson);
router.route('/adminIndex/createLayout_03').post(upload.single("img-file"), createLayout03);
// router.post('/adminIndex/createLayout_01', adminManageLayouts.createLayout_01);
router.post('/adminIndex/createLayout_02', adminManageLayouts.createLayout_02);
// router.post('/adminIndex/createLayout_03', adminManageLayouts.createLayout03);
router.post('/adminIndex/createLayout_04', adminManageLayouts.createLayout04);
router.get('/adminIndex/getMoreAddContent', teacherMiddleware, adminManageLayouts.getMoreAddContent);
router.post('/adminIndex/copyLessons', adminManageLayouts.copyLessons);
router.get('/adminIndex/deleteLesson', teacherMiddleware, adminEditDelete.deleteLesson);
router.get('/adminIndex/editLesson', teacherMiddleware, adminEditDelete.editLesson)
router.post('/adminIndex/makeEdit', adminEditDelete.makeEdit)
router.post('/adminIndex/makeEdit2', adminEditDelete.makeEdit2)
router.post('/adminIndex/makeEdit3', adminEditDelete.makeEdit3)
router.get('/adminIndex/deleteLayout', teacherMiddleware, adminEditDelete.deleteLayout)
router.post('/adminIndex/addEndQuestionChapter', adminManageLayouts.addEndQuestionChapter)

const { createLayout_05 } = require("../controller/adminManageLayouts");
router.route('/adminIndex/createLayout_05').post(upload.single("file"), createLayout_05);

//Admin Dashboard
router.get('/adminIndex/adminDashboard', adminDashboard.adminDashboard);
router.get('/adminIndex/dayProgressHistory', adminDashboard.progressHistory);
router.get('/adminIndex/moreDetailChart', adminDashboard.moreDetailChart);
router.get('/adminIndex/studentDetail', adminDashboard.studentDetail);


//Admin Students Management
// app.post('/upload', manageStudent.upload.single('excelFile'), manageStudent.uploadedFile);
// const { uploadedFile } = require("../controller/manageStudent");
router.post('/upload', manageStudent.uploadedFile)
router.route('/adminIndex/createLayout_05').post(upload.single("file"), createLayout_05);
router.post('/adminIndex/upload-form', manageStudent.uploadedForm);
router.get('/adminIndex/studentInformationAccount', manageStudent.studentInformationAccount);
router.post('/adminIndex/doEditAccount', manageStudent.doEditAccount);
router.post('/adminIndex/addStudentListsToSubject', manageStudent.addStudentListsToSubject);
router.post('/adminIndex/deleteStudentListsFromSubject', manageStudent.deleteStudentListsFromSubject);
router.post('/adminIndex/editScorePerweek', manageStudent.editScorePerweek);
router.post('/adminIndex/setPermissionStudentLists', manageStudent.setPermissionStudentLists)

// Dashboard Management
dashboardManagement
router.post('/updateLessonProgress', dashboardManagement.updateLessonProgress);
router.post('/calculateTimeSpent', dashboardManagement.calculateTimeSpent);

//Student Router
router.get('/studentIndex', studentMiddleware, studentController.studentIndex);
router.get('/studentLesson', studentMiddleware, studentController.studentLesson);
router.get('/studentAssignment', studentMiddleware, studentController.studentAssignment);

//Student Assignment Router
const { submitAssignment, studentEditAssignment } = require("../controller/studentAssignment");
router.route('/submitAssignment').post(upload.array("file"), submitAssignment);
router.get('/studentAssignDetail', studentMiddleware, studentAssignment.studentAssignDetail);
router.route('/studentEditAssignment').post(upload.array("file"), studentEditAssignment);
router.get('/delStudentFile', studentMiddleware, studentAssignment.delStudentFile);
router.get('/historyAssignment', studentMiddleware, studentAssignment.historyAssignment);
router.get('/studentCancelAssign', studentMiddleware, studentAssignment.studentCancelAssign);
router.get('/studentIndex/showFileArray', studentMiddleware, assignmentsController.showFileArray);

// Logs file controller
router.get('/logs', LogsFile.logs);
router.get('/exportLogs', LogsFile.exportLogs);

//Notification
router.get('/adminIndex/maskAllAsRead', teacherMiddleware, notification.markAsReadAll);
router.get('/markAsRead', teacherMiddleware, notification.markAsRead);

// View Files
router.get('/adminIndex/files', assignmentsController.viewfiles);

const { updateLessonProgress, eachLessonStudent } = require("../controller/adminController");

// Middleware สำหรับอัปเดตความคืบหน้า
router.use('/adminIndex/eachLessons', updateLessonProgress, eachLessonStudent);

module.exports = router;
