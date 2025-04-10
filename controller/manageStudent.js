const multer = require('multer');
const xlsx = require('xlsx');
// const upload = multer({ dest: 'uploads/' });
const ExcelJS = require('exceljs');

const Student = require("../models/student.model");
const User = require("../models/user.model");
// const SchoolYear = require("../models/schoolYear");
// const Lesson = require("../models/Lessons");
const Subject = require("../models/subjects");
// const { findByIdAndUpdate, populate } = require('../models/Layout1');
const fs = require('fs');
const iconv = require('iconv-lite');
const storage = multer.memoryStorage();
const { upload } = require('../middleware/multer');


async function getSubjectsForNav(userId) {
  try {
      const userData = await User.findById(userId);
      let subjects = [];
      
      if (!userData) {
          return [];
      }

      if (userData.role === 'student') {
          const studentData = await Student.findOne({ user: userId })
              .populate('subjects.subjectMongooseId');
          
          if (studentData && studentData.subjects) {
              subjects = studentData.subjects
                  .filter(subject => 
                      subject.subjectMongooseId && 
                      !subject.subjectMongooseId.isArchived)
                  .map(subject => subject.subjectMongooseId);
          }
      } else {
          // For teachers and admins, filter out archived subjects
          subjects = await Subject.find({ isArchived: false })
              .sort({ semester: 1 })
              .populate("lessonArray") || [];
      }
      
      return subjects;
  } catch (error) {
      console.error('Error in getSubjectsForNav:', error);
      return [];
  }
}

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
  let filePath;

  try {
    // เพิ่มการดึง user data
    if (req.session.userId) {
      userData = await User.findById(req.session.userId);
    }

    if (!req.file) {
      return res.render('upload-file-2', {
        formData: {},
        error: 'กรุณาเลือกไฟล์ Excel',
        userData: await User.findById(req.session.userId),
        theme,
        isSidebarOpen
      });
    }

    filePath = req.file.path;
    const fileParts = req.file.originalname.split('.');
    const fileType = fileParts[fileParts.length - 1];
    const fileBuffer = fs.readFileSync(filePath);

    // สร้าง object สำหรับเก็บข้อมูลผลการประมวลผล
    const summary = {
      total: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

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
      summary.total = studentLists.length;
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
          
          // ตรวจสอบนักศึกษาที่มีอยู่แล้ว
          let student = await Student.findOne({ studentId: studentId });
          
          if (student) {
            // กรณีมีนักศึกษาอยู่แล้ว
            console.log('Found existing student:', studentId);
            
            // ดึงข้อมูล User ปัจจุบันของนักศึกษา
            let user = await User.findById(student.user);
            
            if (user) {
              // ตรวจสอบว่าข้อมูลที่ได้จากไฟล์แตกต่างจากข้อมูลในฐานข้อมูลหรือไม่
              let hasChanges = false;
              
              if (user.email !== studentEmail || 
                  user.prefix !== prefix || 
                  user.fname !== fname || 
                  user.lname !== lname || 
                  user.major !== studentMajor) {
                
                // อัปเดตข้อมูลผู้ใช้
                user.email = studentEmail;
                user.prefix = prefix;
                user.fname = fname;
                user.lname = lname;
                user.name = studentName;
                user.major = studentMajor;
                
                await user.save();
                hasChanges = true;
              }
              
              // ตรวจสอบว่ามีวิชานี้อยู่แล้วหรือไม่
              const hasSubject = student.subjects.some(s => 
                s.subjectMongooseId.toString() === currentSubject._id.toString()
              );
              
              if (!hasSubject) {
                // เพิ่มวิชาให้กับนักศึกษา
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
                hasChanges = true;
              }
              
              // อัปเดตข้อมูลใน Subject
              const isStudentInSubject = currentSubject.students.includes(student._id);
              if (!isStudentInSubject) {
                await Subject.findByIdAndUpdate(
                  currentSubject._id,
                  { $addToSet: { students: student._id } },
                  { new: true }
                );
                hasChanges = true;
              }
              
              if (hasChanges) {
                summary.updated++;
              } else {
                summary.skipped++;
              }
              
            } else {
              // กรณีไม่พบ user แต่พบ student (ข้อมูลไม่ตรงกัน)
              summary.errors.push({
                studentId,
                error: 'พบข้อมูลนักศึกษาแต่ไม่พบผู้ใช้ที่เชื่อมโยง'
              });
              summary.skipped++;
            }
          } else {
            // กรณีไม่มีนักศึกษา สร้างใหม่
            // ตรวจสอบว่ามี user ที่มี email นี้อยู่แล้วหรือไม่
            let user = await User.findOne({ email: studentEmail });
            
            if (!user) {
              // สร้าง user ใหม่
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
            
            // สร้างนักศึกษาใหม่
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
            
            // อัพเดต Subject reference
            await Subject.findByIdAndUpdate(
              currentSubject._id,
              { $addToSet: { students: student._id } },
              { new: true }
            );
            
            summary.added++;
          }
          
        } catch (error) {
          console.error('Error processing student:', error);
          summary.errors.push({
            error: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
          });
          continue;
        }
      }
      
      // ลบไฟล์หลังจากประมวลผลเสร็จ
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // แสดงผลการอัปโหลดด้วย SweetAlert
      req.session.uploadResults = {
        success: true,
        message: 'อัปโหลดรายชื่อนักศึกษาสำเร็จ',
        summary: summary
      };
      
      req.session.save(function(err) {
        if (err) {
          console.error('Error saving session:', err);
        }
        return res.redirect('/adminIndex/uploadStudent');
      });
    } 
    else if (fileType === "xlsx") {
      // ต้องมีการเปลี่ยนแปลงในส่วนของการประมวลผลไฟล์ xlsx ด้วย
      // โดยใช้ตรรกะเดียวกับ xls ด้านบน
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      // แสดงข้อมูลตัวอย่าง (สามารถลบหรือเปลี่ยนเป็นการประมวลผลจริงได้)
      for (let i = 0; i <= 5 && i < data.length; i++) {
        console.log(data[i]);
      }
      
      // ลบไฟล์หลังจากประมวลผลเสร็จ
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.json(data);
    }
    
  } catch (error) {
    console.error(error);
    // ลบไฟล์ในกรณีเกิด error
    if (filePath && fs.existsSync(filePath)) {
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

const exportStudentList = async (req, res) => {
  try {
    const subjectId = req.query.subjectId;
    const subject = await Subject.findById(subjectId)
      .populate({
        path: 'students',
        populate: {
          path: 'user'
        }
      });

    if (!subject) {
      return res.status(404).send('ไม่พบรายวิชา');
    }

    // สร้าง workbook และ worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายชื่อนักศึกษา');

    // กำหนด columns ใหม่
    const columns = [
      { key: 'no', header: 'เลขที่', width: 8 },
      { key: 'studentId', header: 'รหัสประจำตัว', width: 15 },
      { key: 'name', header: 'ชื่อ', width: 30 },
      { key: 'email', header: 'kkumail', width: 30 },
      { key: 'major', header: 'เอก', width: 8 },
      { key: 'vaccine', header: 'ได้รับวัคซีน(ครั้ง)', width: 15 },
      { key: 'grade', header: 'เกรด', width: 8 },
      { key: 'score', header: 'จาก', width: 8 }
    ];

    // เพิ่ม columns สำหรับสัปดาห์ 1-16
    for (let i = 1; i <= 16; i++) {
      columns.push({ key: `week${i}`, header: `สัปดาห์`, width: 5 });
    }

    worksheet.columns = columns;

    // เพิ่มข้อมูลส่วนหัว
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'มหาวิทยาลัยขอนแก่น';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'left' };

    worksheet.mergeCells('G1:X1');
    worksheet.getCell('G1').value = 'รายชื่อนศ.ที่ลงทะเบียน';
    worksheet.getCell('G1').alignment = { horizontal: 'right' };

    worksheet.mergeCells('G2:X2');
    worksheet.getCell('G2').value = `วิทยาเขต ขอนแก่น ปีการศึกษา ${subject.semester}`;
    worksheet.getCell('G2').alignment = { horizontal: 'right' };

    worksheet.mergeCells('G3:X3');
    worksheet.getCell('G3').value = 'ระดับการศึกษา ปริญญาตรี ภาคปกติ';
    worksheet.getCell('G3').alignment = { horizontal: 'right' };

    worksheet.mergeCells('A4:F4');
    worksheet.getCell('A4').value = 
      `รหัสวิชา ${subject.subjectId} ${subject.subjectName} หน่วยกิต ${subject.unit} กลุ่มที่ ${subject.section}`;

    worksheet.mergeCells('G4:X4');
    worksheet.getCell('G4').value = 'อาจารย์ผู้สอน ...';

    worksheet.mergeCells('A5:F5');
    worksheet.getCell('A5').value = 'วันที่เรียน ...';
    worksheet.mergeCells('G5:X5');
    worksheet.getCell('G5').value = 'วันที่สอบ -';

    // เพิ่มข้อมูลนักศึกษา
    let rowIndex = 6;
    subject.students.forEach((student, index) => {
      const rowData = {
        no: index + 1,
        studentId: student.studentId,
        name: `${student.user.prefix}${student.user.fname} ${student.user.lname}`,
        email: student.user.email,
        major: 'DT',
        vaccine: '-',
        grade: '',
        score: '0'
      };

      // เพิ่มช่องว่างสำหรับสัปดาห์ 1-16
      for (let i = 1; i <= 16; i++) {
        rowData[`week${i}`] = '';
      }

      worksheet.addRow(rowData);
    });

    // จัดรูปแบบตาราง
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'}
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (rowNumber <= 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });

    // ส่งไฟล์
    const fileName = `studentList_${subject.subjectId}_${subject.semester}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting student list:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการ export รายชื่อ');
  }
};


const exportStudentListPage = async (req, res) => {
  try {
    let userData = null;
    if (req.session.userId) {
      userData = await User.findById(req.session.userId);
    }
    const navSubjects = await getSubjectsForNav(req.session.userId);
    const subjects = await Subject.find()
    .sort({ semester: -1 })
    .populate({
      path: 'students',
      populate: {
        path: 'user',
        select: 'prefix fname lname nickname email major studentFromKku'
      }
    });
        res.render('export_studentList', {
      subjects,
      navSubjects,
      theme: req.session.theme || 'light',
      isSidebarOpen: false,
      userData
    });
  } catch (error) {
    console.error('Error loading export page:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้า');
  }
};

const getSubjectStudentsList = async (req, res) => {
  try {
      const { limit = 10, page = 1 } = req.query;
      const actualLimit = limit === 'all' ? 0 : parseInt(limit);
      const skip = (parseInt(page) - 1) * actualLimit;

      const subject = await Subject.findById(req.params.subjectId);
      if (!subject) {
          return res.status(404).json({ message: 'ไม่พบรายวิชา' });
      }

      const totalStudents = subject.students.length;
      const students = actualLimit === 0 
          ? subject.students 
          : subject.students.slice(skip, skip + actualLimit);

      const totalPages = actualLimit === 0 ? 1 : Math.ceil(totalStudents / actualLimit);

      await Subject.populate(students, {
          path: 'user',
          select: 'prefix fname lname nickname email major studentFromKku'
      });

      res.json({
          students,
          currentPage: parseInt(page),
          totalPages,
          totalStudents
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
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
  deleteStudents,
  exportStudentList,
  exportStudentListPage,
  getSubjectStudentsList
};


