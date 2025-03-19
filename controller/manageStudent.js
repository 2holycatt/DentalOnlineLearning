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

const generateWeeks = () => {
  return Array.from({ length: 16 }, (_, index) => ({
      week: (index + 1).toString(),
      scorePerWeek: 0
  }));
};

const extractPrefixAndName = (fullName) => {
  if (!fullName) return { prefix: 'นาย', name: '', fname: '', lname: '' };

  const prefixList = ['นางสาว', 'นาง', 'นาย'];
  let prefix = '';
  let name = fullName;

  console.log('Processing name:', fullName);

  // ตรวจสอบคำนำหน้าที่มีในรายการ
  for (const p of prefixList) {
    if (fullName.startsWith(p)) {
      prefix = p;
      name = fullName.substring(p.length).trim();
      console.log('Found prefix:', prefix, 'name:', name);
      break;
    }
  }

  if (!prefix) {
    prefix = 'นาย';
    console.log('No prefix found, using default:', prefix);
  }

  const nameParts = name.split(' ');
  const fname = nameParts[0];
  const lname = nameParts.slice(1).join(' ');

  console.log('Split name result:', { prefix, fname, lname });
  return { prefix, name, fname, lname };
};



const uploadedFile = async (req, res) => {
  const theme = req.session.theme || 'light';
  const isSidebarOpen = false;
  let userData = null;

  try {
    // เพิ่มการดึง user data
    if (req.session.userId) {
      userData = await User.findById(req.session.userId);
    }

    const filePath = req.file.path;
    const fileParts = req.file.originalname.split('.');
    const fileType = fileParts[fileParts.length - 1];
    const fileBuffer = fs.readFileSync(filePath);

    if (fileType === "xls") {
      
      const decodedBuffer = iconv.decode(fileBuffer, 'win874');
      fs.writeFileSync(filePath, decodedBuffer);
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
    
      // แก้ไขการดึงข้อมูลจาก Excel
      const preSemster = data[0]["รายชื่อนศ.ที่ลงทะเบียน"];
      const splitSemster = preSemster.split(" ");
      const semster = splitSemster[splitSemster.length - 1];
    
      const subject = data[2]['มหาวิทยาลัยขอนแก่น '];
      const subSplit = subject.split(" ");
      const courseId = subSplit[1];
      
      // สร้างหรือค้นหา Subject
      let currentSubject = await Subject.findOne({ subjectId: courseId, semester: semster });
      if (!currentSubject) {
        const subPreJoin = subSplit.slice(2, -5);
        const subjectName = subPreJoin.join(' ');
        let unitIndex = subSplit.indexOf('หน่วยกิต');
        let sectionIndex = subSplit.indexOf('กลุ่มที่');
        let unit = subSplit.slice(unitIndex, unitIndex + 2).join(' ');
        let section = subSplit.slice(sectionIndex).join(' ');
        let splitSection = section.split(' ');
        let splitUnit = unit.split(' ');
    
        currentSubject = await Subject.create({
          subjectId: courseId,
          subjectName: subjectName,
          semester: semster,
          unit: splitUnit[splitUnit.length - 1],
          section: splitSection[splitSection.length - 1]
        });
      }
    
      // ดึงรายชื่อนักศึกษา
      const studentLists = data.slice(6, -3);
      const weeks = generateWeeks();
    
      // ประมวลผลรายชื่อนักศึกษา
      for (const studentData of studentLists) {
        try {
          const updatedValues = Object.values(studentData);
          const studentNumber = updatedValues[0];
          const studentId = updatedValues[1];
          const studentName = updatedValues[2];
          const rawEmail = updatedValues[3];
          const studentEmail = rawEmail.includes('@kkumail.com') 
            ? rawEmail 
            : `${rawEmail}@kkumail.com`;
          const studentMajor = updatedValues[4];
    
          // แยกข้อมูลชื่อ
          const { prefix, fname, lname } = extractPrefixAndName(studentName);
    
          console.log('Processing student:', {
            studentId,
            studentName,
            prefix,
            fname,
            lname,
            studentEmail
          });
    
          // ค้นหาหรือสร้าง User
          let user = await User.findOne({ email: studentEmail });
          if (!user) {
            user = await User.create({
              email: studentEmail,
              prefix: prefix,
              fname: fname,
              lname: lname,
              name: studentName,
              major: studentMajor,
              role: "student",
              studentFromKku: true
            });
          }
    
          // ค้นหาหรือสร้าง Student
          let student = await Student.findOne({ studentId: studentId });
          if (!student) {
            student = await Student.create({
              studentId: studentId,
              user: user._id,
              email: studentEmail,
              prefix: prefix,
              fname: fname,
              lname: lname,
              subjects: [{
                subjectMongooseId: currentSubject._id,
                subjectId: courseId,
                subjectSemster: semster,
                weeks: weeks,
                studentNumber: studentNumber
              }]
            });
            
            // อัพเดต User reference
            await User.findByIdAndUpdate(
              user._id,
              { student: student._id },
              { new: true }
            );
          } else {
            // เพิ่มวิชาให้กับนักศึกษาที่มีอยู่แล้ว
            const hasSubject = student.subjects.some(s => 
              s.subjectMongooseId.toString() === currentSubject._id.toString()
            );
    
            if (!hasSubject) {
              await Student.findByIdAndUpdate(
                student._id,
                {
                  $push: {
                    subjects: {
                      subjectMongooseId: currentSubject._id,
                      subjectId: courseId,
                      subjectSemster: semster,
                      weeks: weeks,
                      studentNumber: studentNumber
                    }
                  }
                },
                { new: true }
              );
            }
          }
    
          // อัพเดต Subject reference
          await Subject.findByIdAndUpdate(
            currentSubject._id,
            { $addToSet: { students: student._id } },
            { new: true }
          );
    
        } catch (error) {
          console.error('Error processing student:', error);
          continue;
        }
      }
    
      // ลบไฟล์หลังจากประมวลผลเสร็จ
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return res.redirect('/adminIndex/uploadStudent');
    }

     else if (fileType === "xlsx") {
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



  } catch (error) {
    console.error(error);
    // ลบไฟล์ในกรณีเกิด error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return res.render('upload-file-2', {
      error: error.code === 11000 ? 'วิชานี้มีอยู่แล้วในภาคการศึกษานี้' : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      formData: req.body,
      theme,
      isSidebarOpen,
      userData
    });
  }
};

const uploadedForm = async (req, res) => {
  const theme = req.session.theme || 'light';
  const isSidebarOpen = false;
  let userData = null;
  try {
    if (req.session.userId) {
      userData = await User.findById(req.session.userId);
    }

    let {
      email,
      prefix,
      fname,
      lname,
      externalStudent,
      major,
      nickname,
      note,
      studentId: formStudentId
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('upload-file-2', {
        error: 'อีเมลนี้มีอยู่ในระบบแล้ว',
        formData: req.body,
        theme,
        isSidebarOpen,
        userData
      });
    }


    let studentId = "";
    if (!req.body.studentId) {
      studentId = await generateStudentId();
    }
    else if (req.body.studentId) {
      studentId = req.body.studentId
    }

    // console.log(studentName);
    // console.log(externalStudent);

    // const studentId = await generateStudentId();
      if (externalStudent == "on") {
        externalStudent = false;
        let newUser = new User({
          email,
          prefix,
          fname,
          lname,
          name: `${prefix}${fname} ${lname}`,
          major: major,
          role: "student",
          studentFromKku: externalStudent,
          note: note,
          nickname: nickname
        });
        await newUser.save();

        const newStudentId = studentId || await generateStudentId();
    const newStudent = new Student({
      studentId: newStudentId,
      user: newUser._id,
      email,
      prefix,
      fname,
      lname
    });
        await newStudent.save();

        await User.findByIdAndUpdate(
          newUser._id,
          { student: newStudent._id },
          { new: true }
        );
    } else {
      externalStudent = true;
      let newUser = new User({
        email,
        prefix,
        fname,
        lname,
        name: `${prefix}${fname} ${lname}`,
        major: major,
        role: "student",
        studentFromKku: externalStudent,
        nickname: nickname
      })
      await newUser.save();

    const newStudent = new Student({
      studentId: studentId,
      user: newUser._id,
      email,
      prefix,
      fname,
      lname
    });

    await newStudent.save();

    // อัพเดท User กับ Student reference
    await User.findByIdAndUpdate(
      newUser._id,
      { student: newStudent._id },
      { new: true }
    );
  }

    return res.redirect('/adminIndex/uploadStudent');

  } catch (error) {
    console.error(error);
    return res.render('upload-file-2', {
      error: error.code === 11000 ? 'มีนักศึกษาคนนี้อยู่ในระบบแล้ว' : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      formData: req.body,
      theme,
      isSidebarOpen,
      userData
    });
  }
};

const studentInformationAccount = async (req, res) => {
  const theme = req.session.theme || 'light';
  const isSidebarOpen = false;
  try {
    let userData = null;
    if (req.session.userId) {
      userData = await User.findById(req.session.userId);
    }

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
    const studentUser = findStudent.user;
    const studentSubmitAssign = findStudent.user.submitAssign;

    let studentSubject = findStudent.subjects;

    let studentSubjectCalculate= [];
    for (let subject of studentSubject) {
      var calculateTotalScore = 0;
      
      // คำนวณคะแนนรวมจาก weeks
      for (let week of subject.weeks) {
        calculateTotalScore += week.scorePerWeek;
      }

      studentSubjectCalculate.push(calculateTotalScore);
    }

    // res.json(studentSubjectCalculate);

    res.render('studentInformationAccount', {
      findStudent,
      studentSubject,
      studentSubjectCalculate,
      userData, // เพิ่มบรรทัดนี้
      theme: req.session.theme || 'light', // เพิ่ม theme
      isSidebarOpen: false // เพิ่ม sidebar state
    });    

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
    res.redirect(`/eachSubject?subjectDbId=${subjectId}`);
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
    res.redirect(`/eachSubject?subjectDbId=${subjectId}`);
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

const deleteStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรายชื่อที่ต้องการลบ'
      });
    }
    // ลบข้อมูลนักศึกษาและอัพเดตการอ้างอิง
    for (const studentId of studentIds) {
      const student = await Student.findOne({ studentId });
      if (student) {
        // ลบการอ้างอิงจาก Subject
        await Subject.updateMany(
          { students: student._id },
          { $pull: { students: student._id } }
        );

        // ลบ User ที่เกี่ยวข้อง
        if (student.user) {
          await User.findByIdAndDelete(student.user);
        }

        // ลบ Student
        await Student.findByIdAndDelete(student._id);
      }
    }

    return res.status(200).json({
      success: true,
      message: `ลบรายชื่อนักศึกษาจำนวน ${studentIds.length} คนเรียบร้อยแล้ว`
    });
  
  } catch (error) {
    console.error('Error deleting students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการลบข้อมูล'
    });
  }
};


module.exports = {
  uploadedFile,
  upload,
  uploadedForm,
  studentInformationAccount,
  doEditAccount,
  addStudentListsToSubject,
  deleteStudentListsFromSubject,
  editScorePerweek,
  setPermissionStudentLists,
  deleteStudents

};


