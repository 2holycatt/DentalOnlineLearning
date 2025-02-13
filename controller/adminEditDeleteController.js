const Lesson = require("../models/Lessons");
const Layout1 = require("../models/Layout1");
const Layout2 = require("../models/Layout2");
const Layout3 = require("../models/Layout3");
const Layout4 = require("../models/Layout4");
const SchoolYear = require("../models/schoolYear");
const Subject = require("../models/subjects");
const PdfFile = require("../models/pdfFile");
const TextEditor = require("../models/TextEditor");
const { deleteFileFromS3 } = require('../utils/s3Utils');
const User = require("../models/user.model");

const fs = require('fs');
const util = require('util');
// const unlinkFile = util.promisify(fs.unlink);
const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });
// const path = require('path');

const deleteLesson = async (req, res) => {
  try {
      const getLesson_id = req.query.lessonId;
      const subject_Id = req.query.subjectId;

      const getLesson = await Lesson.findById(getLesson_id);
      if (!getLesson) {
          return res.status(404).send('Lesson not found');
      }

      // Delete layouts
      const deleteLayout01 = getLesson.LayOut1ArrayObject;
      const deleteLayout02 = getLesson.LayOut2ArrayObject;
      const deleteLayout03 = getLesson.LayOut3ArrayObject;
      const deleteLayout04 = getLesson.LayOut4ArrayObject;
      const deletePdfFiles = getLesson.PdfFiles;

      // Delete all layouts in parallel
      await Promise.all([
          deleteLayout01.length > 0 ? Layout1.deleteMany({ _id: { $in: deleteLayout01 } }) : null,
          deleteLayout02.length > 0 ? Layout2.deleteMany({ _id: { $in: deleteLayout02 } }) : null,
          deleteLayout03.length > 0 ? Layout3.deleteMany({ _id: { $in: deleteLayout03 } }) : null,
          deleteLayout04.length > 0 ? Layout4.deleteMany({ _id: { $in: deleteLayout04 } }) : null,
          deletePdfFiles.length > 0 ? PdfFile.deleteMany({ _id: { $in: deletePdfFiles } }) : null
      ]);

     // Remove lesson from subject's lessonArray
    await Subject.findByIdAndUpdate(
      subject_Id,
      { $pull: { lessonArray: getLesson_id } }
    );

    // Delete the lesson
    await Lesson.findByIdAndDelete(getLesson_id);

      // Redirect using subject_Id from query
      res.redirect(`/eachSubject?subjectDbId=${subject_Id}`);

  } catch (error) {
      console.error('Error deleting lesson:', error);
      res.status(500).send('Internal Server Error');
  }
};

const editLesson = async function (req, res, next) {
  try {
    const userData = await User.findById(req.session.userId);
    const theme = req.session.theme || 'light'; 
    const isSidebarOpen = false; 
    const lessonId = req.query.lessonId;
    const getLessonId = req.query.lessonId;
    const lesson = await Lesson.findById(getLessonId);
    const subjectId = req.query.subjectId;
    const findSubject = await Subject.findById(subjectId);
    const findLesson = await Lesson.findById(lessonId);


    // res.json(findLessons);
    res.render("editLesson", { mytitle: "editLesson", findSubject, findLesson ,lesson ,getLessonId ,userData, theme, isSidebarOpen});

  } catch (err) {
    console.log(err);
  }

}

const deleteLayout = async (req, res) => {
  const _id = req.query.lessonId;
  const getLayout_id = req.query.layoutId;
  const getWhatLayout = req.query.whatLayout;

  if (getWhatLayout === "1") {
    const deleteLayout1 = await Layout1.findById(getLayout_id);
    await deleteFileFromS3(deleteLayout1.AboutImage[0].file);
    await Lesson.findOneAndUpdate(
      { _id: deleteLayout1.LessonArrayObject[0].LessonId },
      { $pull: { LayOut1ArrayObject: getLayout_id } },
      { new: true } // ลบ lessonId ออกจาก lessonArray
    );
  
    await Layout1.findByIdAndDelete(getLayout_id);
  } else if (getWhatLayout === "2") {
    const deleteLayout2 = await Layout2.findById(getLayout_id);

    await Lesson.findOneAndUpdate(
      { _id: deleteLayout2.LessonArrayObject[0].LessonId },
      { $pull: { LayOut2ArrayObject: getLayout_id } },
      { new: true } // ลบ lessonId ออกจาก lessonArray
    );

    await Layout2.findByIdAndDelete(getLayout_id);

  } else if (getWhatLayout === "3") {
    const deleteLayout3 = await Layout3.findById(getLayout_id);
    await deleteFileFromS3(deleteLayout3.file);
    await Lesson.findOneAndUpdate(
      { _id: deleteLayout3.LessonArrayObject[0].LessonId },
      { $pull: { LayOut3ArrayObject: getLayout_id } },
      { new: true } // ลบ lessonId ออกจาก lessonArray
    );
    await Layout3.findByIdAndDelete(getLayout_id);

  } else if (getWhatLayout === "4") {
    const deleteLayout4 = await Layout4.findById(getLayout_id);

    await Lesson.findOneAndUpdate(
      { _id: deleteLayout4.LessonArrayObject[0].LessonId },
      { $pull: { LayOut4ArrayObject: getLayout_id } },
      { new: true } // ลบ lessonId ออกจาก lessonArray
    );

    await Layout4.findByIdAndDelete(getLayout_id);

  } else if (getWhatLayout === "5") {
    const pdf = await PdfFile.findById(getLayout_id);
    await deleteFileFromS3(pdf.file);
    await Lesson.findOneAndUpdate(
      { _id: pdf.LessonArrayObject[0].LessonId },
      { $pull: { PdfFiles: getLayout_id } },
      { new: true } // ลบ lessonId ออกจาก lessonArray
    );
    await PdfFile.findByIdAndDelete(getLayout_id);

  }
  // console.log(_id);

  // เรียกใช้ฟังก์ชั่น deleteLayouts สำหรับแต่ละประเภทของ Layout
  // res.redirect(pageName);

  // res.json(foundLayouts);
  res.redirect('/adminIndex/editLessonContent?lesson='+_id)

}


const makeEdit = async function (req, res, next) {
  try {
    const _id = req.body._id;
    const layoutId = req.body.layoutId;

    // const uploadedFile = req.file.location;

    if (req.file) {
      const updatedData = {
        Topic: req.body.Topic,
        MainDescription: req.body.MainDescription,
        SubDescription: req.body.SubDescription,
        AboutImage: [{
          title: req.body.title,
          file: req.file.location,
          contentType: req.file.mimetype,
          ImageDescription: req.body.ImageDescription
        }],
      };
  
      
      const findLayout = await Layout1.findById(layoutId);
      await deleteFileFromS3(findLayout.AboutImage[0].file);
  
      const result = await Layout1.findOneAndUpdate(
        { _id: layoutId },
        { $set: updatedData },
        { new: true } // ให้คืนค่าข้อมูลที่ถูกอัปเดต
      );
    } else {
     
      const findLayout1 = await Layout1.findById(layoutId);
      // console.log(findLayout1);
      findLayout1.MainDescription = req.body.MainDescription;
      findLayout1.SubDescription = req.body.SubDescription;
      findLayout1.Topic = req.body.Topic;

      findLayout1.AboutImage[0].title = req.body.title;
      findLayout1.AboutImage[0].ImageDescription = req.body.ImageDescription;

      findLayout1.save();
    }


    res.redirect('/adminIndex/editLessonContent?lesson='+_id)
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};

const makeEdit2 = async function (req, res, next) {
  try {
    const _id = req.body._id;
    const layoutId = req.body.layoutId;

    // console.log(_id);
    const Topic = req.body.Topic;
    const TextArea1 = req.body.TextArea1;
    const TextArea2 = req.body.TextArea3;
    const TextArea3 = req.body.TextArea3;
    const updatedData = {
      Topic: Topic,
      TextArea1: TextArea1,
      TextArea2: TextArea2,
      TextArea3: TextArea3,
    };

    const result = await Layout2.findOneAndUpdate(
      { _id: layoutId },
      { $set: updatedData },
      { new: true }
    );
    const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
    // const lessonId = result.LessonArrayObject[0].LessonId;
    const lesson = await Lesson.findById(_id);
    const layout01 = lesson.LayOut1ArrayObject;
    const layout02 = lesson.LayOut2ArrayObject;
    const layout03 = lesson.LayOut3ArrayObject;
    const layout04 = lesson.LayOut4ArrayObject;

    const foundLayouts = [];
    async function findLayoutsAndStoreData(deleteLayouts, Layout) {

      if (deleteLayouts.length > 0) {
        for (const layoutId of deleteLayouts) {
          const foundLayout = await Layout.findById(layoutId);
          if (foundLayout) {
            foundLayouts.push(foundLayout);
          }
        }
      }

      return foundLayouts;
    }

    const foundLayouts1 = await findLayoutsAndStoreData(layout01, Layout1);
    const foundLayouts2 = await findLayoutsAndStoreData(layout02, Layout2);
    const foundLayouts3 = await findLayoutsAndStoreData(layout03, Layout3);
    const foundLayouts4 = await findLayoutsAndStoreData(layout04, Layout4);

    foundLayouts.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      if (dateA < dateB) {
        return -1;
      } else if (dateA > dateB) {
        return 1;
      } else {
        return 0;
      }
    });
    res.render("adminEdit", { mytitle: "adminEdit", lesson, lessons, foundLayouts });

  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};

const makeEdit3 = async function (req, res, next) {
  try {
    const _id = req.body._id;
    const layoutId = req.body.layoutId;
    // const uploadedFile = req.files.FileForm;

    const updatedData = {
      Description: req.body.Description,
      file: req.file.location,
      contentType: req.file.mimetype
    }
    const findLayout = await Layout3.findById(layoutId);
    await deleteFileFromS3(findLayout.file);

    const result = await Layout3.findOneAndUpdate(
      { _id: layoutId },
      { $set: updatedData },
      { new: true } // ให้คืนค่าข้อมูลที่ถูกอัปเดต
    );

    res.redirect('/adminIndex/editLessonContent?lesson='+_id)


  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};

const makeEdit4 = async function (req, res, next) {
  try {
    const _id = req.body._id;

    const updatedData = {
      Topic: req.body.Topic,
      Description: req.body.Description,
      Lists: [],
    };

    const finalCountImg = req.body.finalCountImg;
    for (let i = 0; i <= finalCountImg.length; i++) {
      updatedData.Lists.push({
        list: req.body[`list${i}`],
      });

      const result = await Layout4.findOneAndUpdate(
        { _id: _id },
        { $set: updatedData },
        { new: true }
      );
    }

    res.redirect('/adminIndex/editLessonContent?lesson='+_id)


  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
}

const makeEditPdfiles = async function (req, res, next) {
  try {
    const _id = req.body._id;
    const layoutId = req.body.layoutId;
    // const uploadedFile = req.files.FileForm;

    const findLayout = await PdfFile.findById(layoutId);
    await deleteFileFromS3(findLayout.file);

    const updatedData = {
      file: req.file.location,
      contentType: req.file.mimetype
    }

    const result = await PdfFile.findOneAndUpdate(
      { _id: layoutId },
      { $set: updatedData },
      { new: true } // ให้คืนค่าข้อมูลที่ถูกอัปเดต
    );
    res.redirect('/adminIndex/editLessonContent?lesson='+_id)


  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};

const makeEdittextEditor = async function (req, res, next) {
  try {
    // const _id = req.body._id;
    // const layoutId = req.body.layoutId;
    // const uploadedFile = req.files.FileForm;
    const { title, body, _id, layoutId } = req.body;

    const updatedData = {
      title: title,
      body: body
    }

    const result = await TextEditor.findOneAndUpdate(
      { _id: layoutId },
      { $set: updatedData },
      { new: true } // ให้คืนค่าข้อมูลที่ถูกอัปเดต
    );

    res.redirect('/adminIndex/editLessonContent?lesson='+_id)


  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};




module.exports = {
  deleteLesson,
  editLesson,
  makeEdit,
  makeEdit2,
  makeEdit3,
  makeEdit4,
  deleteLayout,
  makeEditPdfiles,
  makeEdittextEditor
}