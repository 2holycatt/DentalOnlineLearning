
var User = require('../models/user.model')
var bcrypt = require('bcrypt')
var Student = require('../models/student.model')
var Teacher = require('../models/teacher.model')
const Lesson = require("../models/Lessons");

var SchoolYear = require('../models/schoolYear')
const logger = require('../logs/logger');
const axios = require('axios');
// const YOUR_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const YOUR_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const YOUR_REDIRECT_URL = 'http://localhost:4000/auth/google/callback'
// const YOUR_REDIRECT_URL = 'https://rpd-dt.onrender.com/auth/google/callback'


const YOUR_CLIENT_ID = "95141771976-u1v2rj3o8ulagvqsrkgondmq8m4lou9t.apps.googleusercontent.com";
const YOUR_CLIENT_SECRET = "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";
const YOUR_REDIRECT_URL = 'http://dentalonlinelearning-production.up.railway.app/auth/google/callback'
// const YOUR_REDIRECT_URL = 'https://dentalonlinelearning.onrender.com/auth/google/callback'

const authGoogle = async (req, res) => {
    const scope = encodeURIComponent('profile email');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUR_CLIENT_ID}&redirect_uri=${YOUR_REDIRECT_URL}&response_type=code&scope=${scope}`;
    res.redirect(url);
};

const authGoogleCallback = async (req, res) => {
    const { code } = req.query;
    try {
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: YOUR_CLIENT_ID,
            client_secret: YOUR_CLIENT_SECRET,
            code,
            redirect_uri: YOUR_REDIRECT_URL,
            grant_type: 'authorization_code',
        });
        const { access_token, id_token } = data;
        const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const kkumailRegex = /@kkumail\.com$/;
        const gmailRegex = /@gmail\.com$/;
        const getEmail = profile.email;

        const user = await User.findOne({ email: getEmail });
        if (user) {
            const getRole = user.role;
            req.session.userId = user.id;
            req.session.isLoggedIn = true;
            req.session.fname = user.fname;  
            req.session.lname = user.lname;
            //ตรวจสอบว่าโค้ดทั้งหมดที่เกี่ยวข้องกับการตั้งค่าและการใช้งาน session ทำงานถูกต้อง เช่น การเรียก req.session.save()
            //ในบางครั้ง session อาจไม่ถูกบันทึกถ้าหากมีการเปลี่ยนแปลง session object หลังจากที่ response ถูกส่งไปแล้ว
            req.session.save((err) => {
                if (err) {
                    logger.error(`Session save error: ${err.message}`);
                    return res.redirect('/');
                }
                if (getRole == "teacher") {
                    logger.info(`Teacher logged in: ${getEmail}, IP: ${req.ip}, User Agent: ${req.headers['user-agent']}`);
                    return res.redirect('dentalonlinelearning-production.up.railway.app/adminIndex');
                } else if (getRole == "student") {
                    logger.info(`Student logged in: ${getEmail}, IP: ${req.ip}, User Agent: ${req.headers['user-agent']}`);
                    return res.redirect('dentalonlinelearning-production.up.railway.app/studentIndex');
                }
                });
            } else {
                // สร้าง user ใหม่โดยดึงข้อมูลจาก Google profile
                const createUser = await User.create({
                    email: getEmail,
                    role: kkumailRegex.test(getEmail) ? "student" : "teacher",
                    fname: profile.given_name,  // ดึง fname จาก Google
                    lname: profile.family_name, // ดึง lname จาก Google
                    name: profile.displayName   // ดึงชื่อเต็มจาก Google
                });
    
                req.session.userId = createUser.id;
                req.session.isLoggedIn = true;
                req.session.fname = profile.given_name; // เก็บ fname ใน session
                req.session.lname = profile.family_name; // เก็บ lname ใน session
    
                req.session.save((err) => {
                    if (err) {
                        logger.error(`Session save error: ${err.message}`);
                        return res.redirect('/');
                    }
                    logger.info(`New user created: ${getEmail}`);
                    return res.render('studentInformation', { getUser: createUser });
                });
            }
        } catch (err) {
            logger.error(`Error during Google authentication: ${err.message}`);
            return res.redirect('/');
        }
    };

    const logoutGoogle = async (req, res) => {
        try {
            // Check if userId exists in session
            if (req.session.userId) {
                const user = await User.findById(req.session.userId);
                if (user) {
                    logger.info(`User logged out: ${user.email}, IP: ${req.ip}, User Agent: ${req.headers['user-agent']}`);
                } else {
                    logger.info(`User logged out (user not found in DB), IP: ${req.ip}, User Agent: ${req.headers['user-agent']}`);
                }
            } else {
                logger.info(`User logged out (no session), IP: ${req.ip}, User Agent: ${req.headers['user-agent']}`);
            }
    
            // Clear session
            req.session.destroy((err) => {
                if (err) {
                    logger.error(`Logout error: ${err.message}`);
                    return res.status(500).send('Failed to log out.');
                }
    
                // Clear Google auth cookies
                res.clearCookie('google_access_token');
                res.clearCookie('google_id_token');
                res.clearCookie('connect.sid');
    
                // Redirect to home
                res.redirect('/');
            });
        } catch (error) {
            logger.error(`Logout error: ${error.message}`);
            res.status(500).send('An error occurred while logging out.');
        }
    };


const ifNotLoggedIn = async (req, res, next) => {

    let email = "";
    let password = "";
    let data = req.flash('data')[0]

    if (typeof data != "undefined") {
        email = data.email;
        password = data.password;
    }

    res.render('LoginPage', {
        errors: req.flash('validationErrors'),
        email: email,
        password: password
    });
};

// const loginPage = async (req, res) => {
//     try {

//         // const { email, password } = req.body;
//         const kkumailRegex = /@kkumail\.com$/;
//         const gmailRegex = /@gmail\.com$/;

//         const user = await User.findOne({ email });

//         if (user) {
//             const match = await bcrypt.compare(password, user.password);
//             const getRole = user.role;
//             if (match && getRole == "teacher") {
//                 req.session.userId = user.id;
//                 // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
//                 // const getLessonId = req.query.lessonId;
//                 // const lesson = await Lesson.findById(getLessonId);
//                 return res.redirect('/adminIndex');
//             } else {
//                 return res.redirect('/login');
//             }
//         } else if (!user && gmailRegex.test(email)) {
//             const teacher = "teacher";
//             const createUser = new User({
//                 email,
//                 password,
//                 role: teacher
//             });
//             await createUser.save();

//             const createTeacher = new Teacher({
//                 user: createUser._id
//             });
//             await createTeacher.save();
//             const updateUser = await User.findByIdAndUpdate(
//                 { _id: createUser._id },
//                 {
//                     $push: {
//                         teacher: createTeacher._id
//                     }
//                 },
//                 { new: true }
//             );

//             const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
//             const getLessonId = req.query.lessonId;
//             const lesson = await Lesson.findById(getLessonId);
//             const getUser = await User.findById(createUser._id);
//             return res.render('adminIndex', { lessons, lesson });
//         } else if (!user && kkumailRegex.test(email)) {
//             const student = "student";
//             const createUser = new User({
//                 email: getUser.email,
//                 role: student
//             });
//             await createUser.save();

//             const getUser = await User.findById(createUser._id);
//             // console.log("Login successful");
//             // res.json(createUser);
//             res.render('studentInformation', { getUser });

//         }

//     } catch (err) {
//         console.error(err);
//         if (err) {
//             const validationErrors = Object.keys(err.errors).map(key => err.errors[key].message);
//             req.flash('validationErrors', validationErrors)
//             req.flash('data', req.body)
//         }
//         return res.redirect('/login')
//     }
// }

const saveInfoStudent = async (req, res) => {
    try {

        const { userId, email, schoolId, schoolYear,
            fname, lname, faculty, branch, yearLevel
        } = req.body;

        const updateUser = await User.findOneAndUpdate(
            { _id: userId },
            {
                $set: {
                    fname: fname,
                    lname: lname,
                    faculty: faculty,
                    branch: branch
                }
            }
        );

        const findSchoolYear = await SchoolYear.findOne({ schoolYear });

        if (findSchoolYear) {
            const createStudent = new Student({
                schoolId,
                yearLevel,
                user: userId,
                schoolYear: findSchoolYear._id
            })
            await createStudent.save();

            const pushStdId = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        student: createStudent._id
                    }
                },
                { new: true }
            );

        } else if (!findSchoolYear) {
            const createSchoolYear = new SchoolYear({
                schoolYear: schoolYear
            })
            await createSchoolYear.save();

            const createStudent = new Student({
                schoolId,
                yearLevel,
                user: userId,
                schoolYear: createSchoolYear._id
            })
            await createStudent.save();

            const pushStdId = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        student: createStudent._id
                    }
                },
                { new: true }
            );
        }
        logger.info(`Student information saved for user: ${userId}, IP: ${req.ip}, User Agent: ${req.headers['user-agent']}`);
        return res.redirect('/studentIndex');
    } catch (err) {
        console.error(err);
        if (err) {
            logger.error(`Error saving student information: ${err.message}, IP: ${req.ip}, User Agent: ${req.headers['user-agent']}`);
            const validationErrors = Object.keys(err.errors).map(key => err.errors[key].message);
            req.flash('validationErrors', validationErrors)
            req.flash('data', req.body)
        }
        return res.redirect('/')
    }
}

// const logout = async (req, res) => {
//     try {
//         req.session.destroy(() => {
//             res.redirect('/')
//         })
//     } catch (error) {
//         console.error(error)
//     }
// }


module.exports = {
    ifNotLoggedIn,
    saveInfoStudent,
    authGoogle,
    authGoogleCallback,
    logoutGoogle
};