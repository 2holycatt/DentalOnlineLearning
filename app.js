// require('dotenv').config();
// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// const Jimp = require('jimp');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// // const winston = require('../logs/logger');
// const mongoose = require('mongoose')
// // const { MongoClient, GridFSBucket } = require('mongodb');
// const flash = require('connect-flash')
// const session = require("express-session")
// // const { body, validatorResult } = require('express-validator');
// // const cookieSession = require("cookie-session")
// // const fetch = require("node-fetch");
// // const fs = require('fs');
// var multer = require('multer');
// const cors = require('cors');
// const passport = require('passport');
// // const LessonProgress = require('./models/lessonsProgress'); // นำเข้ารุ่น (model) LessonProgress
// const PORT = process.env.PORT || 4000
// const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Elearning";

// // const MongoStore = require('connect-mongo');
// // const authRouter = require('./routes/auth');

// const app = express();

// app.locals.pluralize = require('pluralize');


// // const storage = multer.diskStorage({
// //     destination: function (req, file, cb) {
// //         cb(null, 'uploads/') // กำหนดโฟลเดอร์ uploads ที่จะเก็บไฟล์
// //     },
// //     filename: function (req, file, cb) {
// //         cb(null, file.originalname); // ใช้ชื่อเดิมของไฟล์
// //     }
// // });

// // const upload = multer({ storage: storage });

// // const xlsx = require('xlsx');
// const upload = multer({ dest: 'uploads/' });

// // const Layout1 = require('./models/Layout1');
// // const Layout2 = require('./models/Layout2');
// // const Layout3 = require('./models/Layout3');
// // const Layout4 = require('./models/Layout4');
// // const Lesson = require('./models/Lessons');
// // const subject = require('./models/subjects');

// // const User = require('./models/user.model');
// // const Student = require('./models/student.model');
// // const addAthlete = require('./models/AthleteOat')
// // const addEvent = require('./models/Event')
// // // const addMatch = require('./models/Match')
// // const addTeam = require('./models/Team')

// // const addMatch = require('./models/EventOat')


// const Router = require('./routes/Router.js');
// const manageStudent = require('./controller/manageStudent.js');
// const reminderJob = require('./service/countdown.js');

// const loadNotificationsMiddleware = require('./middleware/notificationMiddleware.js');

// // เชื่อม middleware เข้ากับแอป Express

// // Middleware
// // const signInMiddleware = require("./middleware/signInMiddleware")
// // const adminMiddleware = require("./middleware/adminMiddleware")

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// app.use(logger('dev'));
// // app.use(express.json());
// // app.use(express.urlencoded({
// //     extended: true
// // }));

// app.use(express.json({ charset: 'utf-8' }));
// app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')))
// app.use(express.static(path.join(__dirname, 'uploads')))
// app.use(loadNotificationsMiddleware);

// app.use('/pdfs', express.static('uploads'));

// // //session_middleware
// // app.use(session({
// //     secret: 'keyboard cat',
// //     resave: false,
// //     saveUninitialized: true,
// //     store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/Elearning', collectionName: "session" }),
// //     cookie: {
// //         maxAge: 1000 * 60 * 60 * 24
// //     }
// // }));

// app.use(flash());
// app.use(session({
//     secret: "ppw.smw_094",
//     resave: true,
//     saveUninitialized: true
// }));

// // custom middleware for login
// // const ifNotLoggedIn = (req, res, next) => {
// //     if (!req.session.isLoggedIn) {
// //         return res.render('LoginPage');
// //     }
// //     next();
// // }
// app.get('/', (req, res) => {
//     try {
//         let permission = req.query.permission;
//         let noPermission = null
//         if (permission) {
//             noPermission = "คุณไม่มีสิทธิ์ในการเข้าใช้งาน"
//         }
//         res.render("notLoggedIn", { noPermission });
//         // หรือ res.send('Home Page') เป็นต้น
//     } catch (error) {
//         console.log(error);
//     }
// });

// app.get('/students', (req, res, next) => {
//     res.render('studentInformation');
// });
// app.post('/upload', manageStudent.upload.single('excelFile'), manageStudent.uploadedFile);

// // app.get('/uploadStudentId', async (req, res,) => {

// //     try {
// //         const getAllStudent = await Student.find();
// //         // let stdList = [];
// //         for (i in getAllStudent) {
// //             // console.log(getAllStudent[i].user)
// //             var userId = getAllStudent[i].user;
// //             var stdId = getAllStudent[i]._id;

// //             const updateId = await User.findByIdAndUpdate(
// //                 userId,
// //                 {$push: {student:stdId}},
// //                 {new:true}
// //             )
// //         }
// //         const success = "success"
// //         res.json(success);
// //     } catch (err) {
// //         console.log(err)
// //     }

// // });

// var type = upload.single('file');



// // const url = "mongodb://localhost:27017/Elearning";

// mongoose.connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
//     .then(() => {
//         console.log("Connected to MongoDB");
//         // Start Express server หลังจากที่ MongoDB เชื่อมต่อเรียบร้อยแล้ว
//         app.listen(PORT, () => {
//             console.log("Express server is running on " + PORT);
//         });

//     })
//     .catch((err) => {
//         console.error("MongoDB connection error:", err);
//     });

// global.loggedIn = null

// app.use(passport.session());
// // app.use('/', authRouter);
// // app.use('/teacher', authRouter);
// // app.use('/profile', authRouter);
// app.use('/to', Router)
// app.use(multer().any());

// // Middleware ที่เรียกในทุก request
// app.use((req, res, next) => {
//     // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
//     if (req.isAuthenticated) {
//         // ถ้าล็อกอินแล้ว, เรียก deserializeUser ของ Passport
//         passport.deserializeUser(req.user, (err, user) => {
//             if (err) {
//                 return next(err);
//             }

//             // อัพเดท req.user ด้วยข้อมูลล่าสุด
//             req.user = user;
//             next();
//         });
//     } else {
//         // ถ้ายังไม่ล็อกอิน, ไปต่อไป
//         next();
//     }
// });
// app.use(cors());

// app.use("*", (req, res, next) => {
//     loggedIn = req.session.userId
//     next()
// })

// app.use((req, res, next) => {
//     logger.info(`Received request: ${req.method} ${req.url}`);
//     next();
// });

// app.use(function (err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};

//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
// });




// module.exports = app;


// เรียกใช้ไลบรารีที่จำเป็น
require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require("express-session");
var multer = require('multer');
const cors = require('cors');
const passport = require('passport');

// ตั้งค่าแอป Express
const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/Elearning";

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: "ppw.smw_094",
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(passport.session());

// การตั้งค่าเส้นทาง
app.use('/', Router);
app.use(multer().any());

// จัดการข้อผิดพลาด
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

// เชื่อมต่อ MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log("Express server is running on " + PORT);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

// ตัวแปร global
global.loggedIn = null;

// Export app
module.exports = app;
