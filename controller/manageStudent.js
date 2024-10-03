const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer({ dest: 'uploads/' });
// const ExcelJS = require('exceljs');

const Student = require("../models/student.model");
const User = require("../models/user.model");
// const SchoolYear = require("../models/schoolYear");
// const Lesson = require("../models/Lessons");
const Subject = require("../models/subjects");
// const { findByIdAndUpdate, populate } = require('../models/Layout1');
const fs = require('fs');
const iconv = require('iconv-lite');

const generateStudentId = async () => {
  const prefix = 'es';
  const regex = new RegExp(`^${prefix}\\d+$`, 'i');

  const latestStudent = await Student.findOne({ studentId: regex }).sort({ studentId: -1 });

  if (!latestStudent) {
    return `${prefix}1`;
  }

  const latestIdNumber = parseInt(latestStudent.studentId.replace(prefix, ''), 10);
  const newIdNumber = latestIdNumber + 1;
  return `${prefix}${newIdNumber}`;
};


const uploadedFile = async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileParts = req.file.originalname.split('.');
    const fileType = fileParts[fileParts.length - 1];
    // // อ่านไฟล์เป็น buffer
    const fileBuffer = fs.readFileSync(filePath);
    if (fileType === "xls") {
      const decodedBuffer = iconv.decode(fileBuffer, 'win874'); // สำหรับการเข้ารหัสภาษาไทยใน Excel 97-2003

      // สร้างไฟล์ใหม่ด้วยการเข้ารหัสที่ถูกต้อง
      fs.writeFileSync(filePath, decodedBuffer);

      // อ่านไฟล์ Excel ด้วย xlsx
      const workbook = xlsx.readFile(filePath);

      // สมมติว่าเราต้องการอ่านข้อมูลจากแผ่นแรก
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // // แปลงข้อมูลใน worksheet เป็น JSON
      const data = xlsx.utils.sheet_to_json(worksheet);
      const preSemster = data[0]["รายชื่อนศ.ที่ลงทะเบียน"];
      const splitSemster = preSemster.split(" ");
      const semster = splitSemster[splitSemster.length - 1];

      const subject = data[2]['มหาวิทยาลัยขอนแก่น '];
      const subSplit = subject.split(" ");
      const subPreJoin = subSplit.slice(2, -5);
      const subjectName = subPreJoin.join(' ');
      const teachers = data[2]["รายชื่อนศ.ที่ลงทะเบียน"];

      let unitIndex = subSplit.indexOf('หน่วยกิต');
      let sectionIndex = subSplit.indexOf('กลุ่มที่');

      let courseId = subSplit[1];

      let unit = subSplit.slice(unitIndex, unitIndex + 2).join(' ');
      let section = subSplit.slice(sectionIndex).join(' ');
      let splitSection = section.split(' ');
      let splitUnit = unit.split(' ');
      // ตัวแปรที่ประมวลผลเสร็จเรียบร้อยแล้ว 
      // semster
      // subjectName
      // courseId
      // unit
      // section
      const checkExistSubject = await Subject.findOne({ subjectId: courseId, semester: semster });


      if (!checkExistSubject) {
        const createSubject = new Subject(
          {
            subjectId: courseId,
            subjectName: subjectName,
            semester: semster,
            unit: splitUnit[splitUnit.length - 1],
            section: splitSection[splitSection.length - 1]
          }
        )
        await createSubject.save();
        const subjectId = createSubject._id;

        const studentLists = [];
        for (let i = 6; i <= data.length - 3; i++) {
          studentLists.push(data[i]);
        }

        // const studentProcessLists = [];

        const weeks = Array.from({ length: 16 }, (_, index) => ({
          week: (index + 1).toString(), // แปลงเป็น string ตาม schema
          // scorePerWeek และ noteWeek จะใช้ค่าเริ่มต้นจาก schema
        }));

        async function processStudents(studentLists) {
          for (const student of studentLists) {
            // const values = Object.values(student);
            // const firstFiveValues = values.slice(0, 5);

            let updatedData = { ...student };

            // เปลี่ยนค่า __EMPTY_2 โดยเอาข้อความตั้งแต่ @kkumail.com ออก
            if (updatedData.__EMPTY_2) {
              updatedData.__EMPTY_2 = updatedData.__EMPTY_2.split('@')[0];
            }

            // แปลง object เป็น array ของ values อีกครั้ง
            const updatedValues = Object.values(updatedData);
            const updatedFirstFiveValues = updatedValues.slice(0, 5);

            // studentProcessLists.push(updatedFirstFiveValues);

            const studentNumber = updatedFirstFiveValues[0];
            const studentId = updatedFirstFiveValues[1];
            const studentName = updatedFirstFiveValues[2];
            const studentEmail = updatedFirstFiveValues[3];
            const studentMajor = updatedFirstFiveValues[4];

            const findUser = await User.findOne({ email: studentEmail }).populate("student");
            console.log("user email" + findUser);

            if (!findUser) {
              // console.log('ยังไม่มี email: '+studentEmail+' นี้ในฐานข้อมูล')
              const createUser = new User({
                email: studentEmail,
                name: studentName,
                major: studentMajor,
                role: "student",
                studentFromKku: true
              });

              await createUser.save();

              const createStudent = new Student({
                studentId: studentId,
                user: createUser._id,
                subjects: {
                  subjectMongooseId: subjectId,
                  subjectId: courseId,
                  subjectSemster: semster,
                  weeks: weeks,
                  studentNumber: studentNumber
                }
              })

              await createStudent.save();

              const updateStudentIdToSubject = await Subject.findByIdAndUpdate(
                subjectId,
                { $push: { students: createStudent._id } },
                { new: true }
              )

              const updateStudentIdToUser = await User.findByIdAndUpdate(
                createUser._id,
                { $push: { student: createStudent._id } },
                { new: true }
              )

            } else if (findUser) {

              const subjects = {
                subjectMongooseId: subjectId,
                subjectId: courseId,
                subjectSemster: semster,
                weeks: weeks
              }

              const studentId = findUser.student._id;

              const student = await Student.findOne({
                studentId: studentId,
                'subjects.subjectMongooseId': subjectId
              });

              if (student == null) {

                const updateStudent = await Student.findByIdAndUpdate(
                  studentId,
                  { $push: { subjects: subjects } },
                  { new: true }
                );

                const updateStudentIdToSubject = await Subject.findByIdAndUpdate(
                  subjectId,
                  { $push: { students: studentId } },
                  { new: true }
                )
              }
            }
          }
        }

        // เรียกใช้ฟังก์ชัน
        await processStudents(studentLists);


      } else if (checkExistSubject) {
        const subjectId = checkExistSubject._id;

        const studentLists = [];
        for (let i = 6; i <= data.length - 3; i++) {
          studentLists.push(data[i]);
        }

        // const studentProcessLists = [];

        const weeks = Array.from({ length: 16 }, (_, index) => ({
          week: (index + 1).toString(), // แปลงเป็น string ตาม schema
          // scorePerWeek และ noteWeek จะใช้ค่าเริ่มต้นจาก schema
        }));

        async function processStudents(studentLists) {
          for (const student of studentLists) {
            // const values = Object.values(student);
            // const firstFiveValues = values.slice(0, 5);

            let updatedData = { ...student };

            // เปลี่ยนค่า __EMPTY_2 โดยเอาข้อความตั้งแต่ @kkumail.com ออก
            if (updatedData.__EMPTY_2) {
              updatedData.__EMPTY_2 = updatedData.__EMPTY_2.split('@')[0];
            }

            // แปลง object เป็น array ของ values อีกครั้ง
            const updatedValues = Object.values(updatedData);
            const updatedFirstFiveValues = updatedValues.slice(0, 5);

            // studentProcessLists.push(updatedFirstFiveValues);

            const studentNumber = updatedFirstFiveValues[0];
            const studentId = updatedFirstFiveValues[1];
            const studentName = updatedFirstFiveValues[2];
            const studentEmail = updatedFirstFiveValues[3];
            const studentMajor = updatedFirstFiveValues[4];

            const findUser = await User.findOne({ email: studentEmail }).populate("student");
            console.log("user email" + findUser);

            if (!findUser) {

              // console.log('ยังไม่มี email: '+studentEmail+' นี้ในฐานข้อมูล')
              const createUser = new User({
                email: studentEmail,
                name: studentName,
                major: studentMajor,
                role: "student",
                studentFromKku: true
              });

              await createUser.save();

              const createStudent = new Student({
                studentId: studentId,
                user: createUser._id,
                subjects: {
                  subjectMongooseId: subjectId,
                  subjectId: courseId,
                  subjectSemster: semster,
                  weeks: weeks,
                  studentNumber: studentNumber
                }
              })

              await createStudent.save();

              const updateStudentIdToSubject = await Subject.findByIdAndUpdate(
                subjectId,
                { $push: { students: createStudent._id } },
                { new: true }
              )

              const updateStudentIdToUser = await User.findByIdAndUpdate(
                createUser._id,
                { $push: { student: createStudent._id } },
                { new: true }
              )

            } else if (findUser) {
              const subjectExists = findUser.student.subjects.some(subject => subject.subjectMongooseId.equals(subjectId));
              if (!subjectExists) {
                const subjects = {
                  subjectMongooseId: subjectId,
                  subjectId: courseId,
                  subjectSemster: semster,
                  weeks: weeks
                }

                const studentId = findUser.student._id;

                const student = await Student.findOne({
                  studentId: studentId,
                  'subjects.subjectMongooseId': subjectId
                });

                if (student == null) {

                  const updateStudent = await Student.findByIdAndUpdate(
                    studentId,
                    { $push: { subjects: subjects } },
                    { new: true }
                  );

                  const updateStudentIdToSubject = await Subject.findByIdAndUpdate(
                    subjectId,
                    { $push: { students: studentId } },
                    { new: true }
                  )
                }
              }

            }
          }
        }

        // เรียกใช้ฟังก์ชัน
        await processStudents(studentLists);
      }

    } else if (fileType === "xlsx") {
      const workbook = xlsx.readFile(filePath);

      // สมมติว่าเราต้องการอ่านข้อมูลจากแผ่นแรก
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // แปลงข้อมูลใน worksheet เป็น JSON
      const data = xlsx.utils.sheet_to_json(worksheet);
      for (let i = 0; i <= 5 && i < data.length; i++) {
        console.log(data[i]);
      }
      res.json(data);
      // แสดงผล 5 แถวแรก

    }

    // // ตรวจสอบว่า buffer มีข้อมูล
    // if (fileBuffer.length === 0) {
    //   throw new Error('File is empty');
    // }

    // console.log('File size:', fileBuffer.length, 'bytes');

    // // ทดลองใช้ encoding ต่างๆ
    // const encodings = ['utf-8', 'tis-620', 'windows-874', 'utf-16le', 'utf-16be'];
    // let workbook;
    // let correctEncoding;

    // for (let encoding of encodings) {
    //   try {
    //     const decodedBuffer = iconv.decode(fileBuffer, encoding);
    //     workbook = xlsx.read(decodedBuffer, { type: 'string' });
    //     correctEncoding = encoding;
    //     break;
    //   } catch (error) {
    //     console.log(`Failed to read with ${encoding} encoding`);
    //   }
    // }

    // if (!workbook) {
    //   throw new Error('Unable to read the Excel file with any known encoding');
    // }

    // console.log('Correct encoding:', correctEncoding);

    // const sheetName = workbook.SheetNames[0];
    // const sheet = workbook.Sheets[sheetName];
    // const data = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });



    // res.json(data);
    fs.unlinkSync(filePath);
    res.redirect('/adminIndex/uploadStudent');
    // for (let i = 1; i < data.length; i++) {
    //   const userData = {
    //     email: data[i][5],
    //     prefix: data[i][1],
    //     name: data[i][2],
    //     faculty: data[i][3],
    //     branch: data[i][4],
    //   };
    //   const filter = { email: userData.email };
    //   const update = { $set: userData };
    //   const options = { upsert: true, returnDocument: 'after' };

    //   const findEmail = await User.findOne(filter).populate({
    //       path: 'student',
    //       populate: { path: 'schoolYear' }
    //     });;

    //   console.log(findEmail);
    //   if (findEmail == undefined) {
    //     const newUser = new User(userData);
    //     await newUser.save();
    //     const userId = newUser._id;
    //     const studentData = {
    //       schoolId: data[i][0],
    //       yearLevel: data[i][7],
    //       user: userId
    //     }

    //     const newStudent = new Student(studentData);
    //     await newStudent.save(); // บันทึกข้อมูลลงในฐานข้อมูล

    //     const addedStdId = await User.findByIdAndUpdate(
    //       userId,
    //       { $push: { student: newStudent._id } },
    //       { new: true }
    //     );

    //     const schoolYear = data[i][6];
    //     const studentId = newStudent._id;
    //     const checkExists = await SchoolYear.findOne({ schoolYear });
    //     if (checkExists) {
    //       const getYear = checkExists.schoolYear;
    //       const addId = await SchoolYear.findByIdAndUpdate(
    //         checkExists._id,
    //         { $push: { students: studentId._id } },
    //         { new: true }
    //       );

    //       const addIdStudent = await Student.findByIdAndUpdate(
    //         studentId._id,
    //         { $push: { schoolYear: checkExists._id } },
    //         { new: true }
    //       );
    //     } else if (!checkExists) {
    //       const creataSchoolYear = new SchoolYear({
    //         schoolYear: schoolYear
    //       });
    //       await creataSchoolYear.save()
    //       const getYear2 = creataSchoolYear.schoolYear;
    //       const addId = await Student.findByIdAndUpdate(
    //         studentId._id,
    //         { $push: { schoolYear: studentId._id } },
    //         { new: true }
    //       );
    //     } const findUser = await User.findById(userId).populate({
    //       path: 'student',
    //       populate: { path: 'schoolYear' } // populate ข้อมูล SchoolYear ใน Student ใน User
    //     });


    //     // const findUser = await User.findById(userId).populate('student').populate('schoolYear');
    //     // console.log("email ไม่ซ้ำกัน");
    //     // console.log(findUser);
    //   } else {
    //     // console.log("email ซ้ำกัน");
    //     // console.log(findEmail);
    //     const updatedUser = await User.findOneAndUpdate(filter, update, options);
    //     // const getStudentId = findEmail.student;
    //     // const studentData = {
    //     //   schoolId: data[i][0],
    //     //   yearLevel: data[i][7],
    //     // }
    //     // const updateStud = { $set: studentData };
    //     // const optionsStd = { upsert: true, returnDocument: 'after' };
    //     // const updatedStudent = await Student.findByIdAndUpdate(getStudentId, updateStud, optionsStd);
    //     const schoolYear = data[i][6];
    //     // console.log("ปีเก่า = "+ findEmail.student.schoolYear.schoolYear);
    //     // console.log("ปีใหม่ = "+ schoolYear);
    //     // const convertToStringYear = schoolYear.toString();
    //     const schoolYearObject = { schoolYear: data[i][6] };
    //     const oldYear = findEmail.student.schoolYear.schoolYear;
    //     if (schoolYear != oldYear) {
    //       const findYear = await SchoolYear.findOne(schoolYearObject);
    //       if (findYear) {
    //         const updatedYear = await Student.findByIdAndUpdate(
    //           { _id: findEmail.student._id },
    //           { $set: { schoolYear: findYear._id } },
    //           { new: true }
    //         );
    //       } else if (!findYear) {
    //         const creataSchoolYear = new SchoolYear({
    //           schoolYear: schoolYear
    //         });
    //         await creataSchoolYear.save()
    //         const getYear2 = creataSchoolYear.schoolYear;
    //         const addId = await Student.findByIdAndUpdate(
    //           { _id: findEmail.student._id },
    //           { $push: { schoolYear: findYear._id } },
    //           { new: true }
    //         );
    //       }
    //     }
    //     // const findSchoolYear = await SchoolYear.findOne({schoolYear});
    //     // const getSchoolYearNumber = await 
    //     // if (schoolYear != findEmail.student.)

    //   }

    // }
    // res.redirect('/adminIndex/uploadStudent');
    // res.json(findEmail);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) { // รหัสข้อผิดพลาดสำหรับ duplicate key error
      // ส่งข้อความแจ้งเตือนไปยังหน้า EJS
      res.render('upload-file-2', {
        error: 'วิชานี้มีอยู่แล้วในภาคการศึกษานี้',
        formData: req.body // ส่งข้อมูลฟอร์มกลับไปเพื่อให้ผู้ใช้ไม่ต้องกรอกใหม่
      });
    } else {
      res.render('upload-file-2', {
        error: 'format ไฟล์ไม่ถูกต้อง',
        formData: req.body // ส่งข้อมูลฟอร์มกลับไปเพื่อให้ผู้ใช้ไม่ต้องกรอกใหม่
      });
    }
  }
};

const uploadedForm = async (req, res) => {
  try {
    let {
      email,
      inlineRadioOptions,
      fname,
      lname,
      externalStudent,
      major,
      nickname,
      note
    } = req.body;

    let studentId = "";
    if (!req.body.studentId) {
      studentId = await generateStudentId();
    }
    else if (req.body.studentId) {
      studentId = req.body.studentId
    }

    const studentName = inlineRadioOptions + fname + " " + lname;
    // console.log(studentName);
    // console.log(externalStudent);

    // const studentId = await generateStudentId();

    if (externalStudent == "on") {
      externalStudent = false;
      let newUser = new User({
        email,
        name: studentName,
        major: major,
        role: "student",
        studentFromKku: externalStudent,
        note: note,
        nickname: nickname
      })
      await newUser.save();

      const newStudent = new Student({
        studentId,
        user: newUser._id
      })
      await newStudent.save();

    } else {
      externalStudent = true;
      let newUser = new User({
        email,
        name: studentName,
        major: major,
        role: "student",
        studentFromKku: externalStudent,
        nickname: nickname
      })
      await newUser.save();

      const newStudent = new Student({
        studentId,
        user: newUser._id
      })
      await newStudent.save();
    }

    // console.log(major);



    // const getUserId = newUser._id;

    // const newStudent = new Student({
    //   schoolId: req.body.studentId,
    //   studentSchoolYear: req.body.schoolYears,
    //   user: getUserId,
    // });
    // await newStudent.save(); // บันทึกข้อมูลลงในฐานข้อมูล
    res.redirect('/adminIndex/uploadStudent');
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.render('upload-file-2', {
        error: 'มีนักศึกษาคนนี้อยู่ในระบบแล้ว',
        formData: req.body,
      });
    }
    // res.status(500).send('An error occurred');
  }
};

const studentInformationAccount = async (req, res) => {
  try {

    const studentId = req.query.studentId;
    const findStudent = await Student.findOne({ studentId: studentId })
      .populate(
        'subjects.subjectMongooseId'
      ).populate({
        path: 'user',
        populate: {
          path: 'submitAssign'
        }
      });


    // res.json(findStudent);
    const studentSubject = findStudent.subjects;
    const studentUser = findStudent.user;
    const studentSubmitAssign = findStudent.user.submitAssign;

    res.render("studentInformationAccount", { findStudent, studentSubject, studentUser, studentSubmitAssign });
    // res.render("editStudentAccount", { mytitle: "editStudentAccount", lesson, lessons, foundLayouts });

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

const doEditAccount = async (req, res) => {
  try {

    const stu_id = req.body._id;
    // console.log(stu_id);
    const getUser2 = await Student.findById(stu_id).populate("user");
    const getIduser = getUser2.user;
    const getfname = req.body.fname;
    const getlname = req.body.lname;

    const updatedData = {
      email: req.body.email,
      prefix: req.body.prefix,
      name: getfname + " " + getlname,
      faculty: req.body.faculty,
      branch: req.body.branch,
    }

    const result = await User.findOneAndUpdate(
      { _id: getIduser },
      { $set: updatedData },
      { new: true }
    );

    const updatedData2 = {
      schoolId: req.body.studentId,
      studentSchoolYear: req.body.schoolYears,
    }

    const result2 = await Student.findOneAndUpdate(
      { _id: stu_id },
      { $set: updatedData2 },
      { new: true }
    );

    // const stuId = req.query.stuId;
    // const stuInfo = await Student.findById(stuId).populate("user");
    // const getSchoolYear = stuInfo.schoolYear;
    // // console.log(getSchoolYear);
    // const findSchool = await SchoolYear.findById(getSchoolYear);
    // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    // const getLessonId = req.query.lessonId;
    // const lesson = await Lesson.findById(getLessonId);
    // const allStudents = await Student.find().populate('user');
    res.redirect('/adminIndex/uploadStudent');
    // res.render("editStudentAccount", { mytitle: "editStudentAccount", lesson, lessons, foundLayouts });

  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

const addStudentListsToSubject = async (req, res) => {
  try {
    const subjectId = req.body.subjectId;
    const studentLists = req.body.studentLists;

    const weeks = Array.from({ length: 16 }, (_, index) => ({
      week: (index + 1).toString(), // แปลงเป็น string ตาม schema
      // scorePerWeek และ noteWeek จะใช้ค่าเริ่มต้นจาก schema
    }));
    // res.json(studentLists);
    for (i in studentLists) {
      const findStudent = await Student.findById(studentLists[i]).populate('user');
      const findSubjectData = await Subject.findById(subjectId);
      let subjects = {
        subjectMongooseId: subjectId,
        subjectId: findSubjectData.subjectId,
        subjectSemster: findSubjectData.semester,
        weeks: weeks
      }

      const updateIdtoStudent = await Student.findByIdAndUpdate(
        findStudent._id,
        { $push: { subjects: subjects } },
        { new: true }
      );
      const findSubject = await Subject.findByIdAndUpdate(
        subjectId,
        { $push: { students: findStudent._id } },
        { new: true }
      );
    }
    res.redirect(`/adminIndex/manageSubject?subjectDbId=${subjectId}`);
  } catch (err) {
    console.log(err);
  }
}

const setPermissionStudentLists = async (req, res) => {
  try {
    const selectedUsers = req.body.userLists || [];
    const studentIds = req.body.studentIds || [];

    // res.json(studentLists);

    await User.updateMany(
      { _id: { $in: selectedUsers }, role: 'student', student: { $in: studentIds } },
      { $set: { permission: true } }
    );

    await User.updateMany(
      { _id: { $nin: selectedUsers }, role: 'student', student: { $in: studentIds } },
      { $set: { permission: false } }
    );

    res.redirect(`/adminIndex/setPermission`);
  } catch (err) {
    console.log(err);
  }
}

const deleteStudentListsFromSubject = async (req, res) => {
  try {
    const subjectId = req.body.subjectId;
    const studentLists = req.body.studentLists;

    await Subject.findByIdAndUpdate(subjectId, {
      $pull: { students: { $in: studentLists } }
    });

    for (let i = 0; i < studentLists.length; i++) {
      await Student.findByIdAndUpdate(studentLists[i], {
        $pull: { subjects: { subjectMongooseId: subjectId } }
      });
    }
    res.redirect(`/adminIndex/manageSubject?subjectDbId=${subjectId}`);
  } catch (err) {
    console.log(err);
  }
}

const editScorePerweek = async (req, res) => {
  try {
    const formData = req.body;
    const { studentId, subjectId } = formData;
    const student = await Student.findById(studentId);
    // res.json(student);
    // ค้นหาวิชาใน subjects array ตาม subjectId
    // const subject = student.subjects.find(sub => sub.subjectMongooseId === subjectId);
    const subject = student.subjects.find(sub => sub.subjectId === subjectId);
    // res.json(subject);
    // if (!subject) {
    //   return res.status(404).send('Subject not found');
    // }

    // อัปเดตคะแนน scorePerWeek ตามข้อมูลที่ได้จาก formData
    subject.weeks.forEach((week, index) => {
      const scoreKey = `editScorePerweek${index}`;
      if (formData[scoreKey] !== undefined) {
        week.scorePerWeek = parseInt(formData[scoreKey], 10);
      }
    });

    // // บันทึกการเปลี่ยนแปลงใน database
    await student.save();
    // res.json(formData);
    res.redirect(`/adminIndex/studentInformationAccount?studentId=${student.studentId}`);


  } catch (err) {
    console.log(err);
  }
}
module.exports = {
  uploadedFile,
  upload,
  uploadedForm,
  studentInformationAccount,
  doEditAccount,
  addStudentListsToSubject,
  deleteStudentListsFromSubject,
  editScorePerweek,
  setPermissionStudentLists
};


