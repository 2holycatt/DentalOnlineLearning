require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const passport = require('passport');
const multer = require('multer');
const flash = require('connect-flash');
const nocache = require('nocache');
const http = require('http');
const Notification = require('./models/notification'); // เปลี่ยน path ตามที่ถูกต้อง


const Router = require('./routes/Router.js');
const manageStudent = require('./controller/manageStudent.js');
const loadNotificationsMiddleware = require('./middleware/notificationMiddleware.js');
const app = express();
const MONGO_URI = process.env.MONGO_URI;

// const winston = require('../logs/logger');
// const { MongoClient, GridFSBucket } = require('mongodb');
// const { body, validatorResult } = require('express-validator');
// const cookieSession = require("cookie-session")
// const fetch = require("node-fetch");
// const fs = require('fs');
// const LessonProgress = require('./models/lessonsProgress'); // นำเข้ารุ่น (model) LessonProgress


// const authRouter = require('./routes/auth');


// const PORT = process.env.PORT || 4000;

// ปิดการใช้งาน view cache ในโหมด development
if (process.env.NODE_ENV !== 'production') {
    app.disable('view cache');
}

app.locals.pluralize = require('pluralize');


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/') // กำหนดโฟลเดอร์ uploads ที่จะเก็บไฟล์
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname); // ใช้ชื่อเดิมของไฟล์
//     }
// });

// const upload = multer({ storage: storage });

// const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' });



const reminderJob = require('./service/countdown.js');




// เชื่อม middleware เข้ากับแอป Express

// Middleware
// const signInMiddleware = require("./middleware/signInMiddleware")
// const adminMiddleware = require("./middleware/adminMiddleware")

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(express.json());
// app.use(express.urlencoded({
//     extended: true
// }));

app.use(logger('dev'));
app.use(nocache());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'uploads')))
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/pdfs', express.static('uploads'));
app.use(cors());
app.use(flash());
app.use(loadNotificationsMiddleware);



// //session_middleware
// app.use(session({
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: true,
//     store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/Elearning', collectionName: "session" }),
//     cookie: {
//         maxAge: 1000 * 60 * 60 * 24
//     }
// }));
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4
})
    .then(() => {
        console.log("Connected to MongoDB Atlas");
        const server = http.createServer(app);
    
        // Increase timeout settings
        server.keepAliveTimeout = 120000; // 120 seconds
        server.headersTimeout = 120000; // 120 seconds
        
        // Get port from environment and store in Express
        const port = process.env.PORT || 10000;
        const host = '0.0.0.0';
        // Start Express server หลังจากที่ MongoDB เชื่อมต่อเรียบร้อยแล้ว
        server.listen(port, host, () => {
            console.log(`Server running at http://${host}:${port}/`);
        });

    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });


//สำหรับ localhost
// app.use(session({
//     secret: "ppw.smw_094",
//     resave: true,
//     saveUninitialized: true
// }));

//สำหรับ Deploy
app.use(session({
    secret: "ppw.smw_094",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGO_URI,
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// custom middleware for login
// const ifNotLoggedIn = (req, res, next) => {
//     if (!req.session.isLoggedIn) {
//         return res.render('LoginPage');
//     }
//     next();
// }
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



// app.get('/uploadStudentId', async (req, res,) => {

//     try {
//         const getAllStudent = await Student.find();
//         // let stdList = [];
//         for (i in getAllStudent) {
//             // console.log(getAllStudent[i].user)
//             var userId = getAllStudent[i].user;
//             var stdId = getAllStudent[i]._id;

//             const updateId = await User.findByIdAndUpdate(
//                 userId,
//                 {$push: {student:stdId}},
//                 {new:true}
//             )
//         }
//         const success = "success"
//         res.json(success);
//     } catch (err) {
//         console.log(err)
//     }

// });

var type = upload.single('file');





// mongoose.connect(MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
//     .then(() => {
//         console.log("Connected to MongoDB");
//         // ไม่ต้องเรียกใช้ app.listen ใน Vercel
//     })
//     .catch((err) => {
//         console.error("MongoDB connection error:", err);
//     });

global.loggedIn = null
app.use((req, res, next) => {
    // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
    if (req.isAuthenticated) {
        // ถ้าล็อกอินแล้ว, เรียก deserializeUser ของ Passport
        passport.deserializeUser(req.user, (err, user) => {
            if (err) {
                return next(err);
            }

            // อัพเดท req.user ด้วยข้อมูลล่าสุด
            req.user = user;
            next();
        });
    } else {
        // ถ้ายังไม่ล็อกอิน, ไปต่อไป
        next();
    }
});
app.use(passport.session());
// app.use('/', authRouter);
// app.use('/teacher', authRouter);
// app.use('/profile', authRouter);
app.use('/', Router)
app.get('/students', (req, res, next) => {
    res.render('studentInformation');
});
app.post('/upload', manageStudent.upload.single('excelFile'), manageStudent.uploadedFile);
app.use(multer().any());

// Middleware ที่เรียกในทุก request


app.use("*", (req, res, next) => {
    loggedIn = req.session.userId
    next()
})

app.use((req, res, next) => {
    logger.info(`Received request: ${req.method} ${req.url}`);
    next();
});

app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// Create server with proper timeout settings
// const http = require('http');
// const server = http.createServer(app);

// // Increase timeout settings
// server.keepAliveTimeout = 120000; // 120 seconds
// server.headersTimeout = 120000; // 120 seconds

// // Get port from environment and store in Express
// const port = process.env.PORT || 10000;
// const host = '0.0.0.0';

// // Start server after MongoDB connects
// mongoose.connection.once('open', () => {
//     server.listen(port, host, () => {
//         console.log(`Server running at http://${host}:${port}/`);
//     });
// });

// Handle server errors
// server.on('error', (error) => {
//     if (error.syscall !== 'listen') {
//       throw error;
//     }
//     console.error(`Failed to start server: ${error}`);
//     process.exit(1);
//   });

async function fetchNotification() {
    try {
        const docs = await Notification.find().maxTimeMS(5000);
        console.log('Notification:', docs);
    } catch (err) {
        console.error('Error loading notifications:', err);
    }
}
fetchNotification();

module.exports = app;