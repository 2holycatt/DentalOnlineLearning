const Lesson = require("../models/Lessons");
const Layout1 = require("../models/Layout1");
const fs = require('fs');
const path = require('path');
const Layout2 = require("../models/Layout2");
const Layout3 = require("../models/Layout3");
const Layout4 = require("../models/Layout4");
const Layout5 = require("../models/Layout5");
const pdfFile = require("../models/pdfFile");

const asyncWrapper = require("../middleware/asyncWrapper");
const lessonQuestion = require("../models/LessonQuestion");
const Subject = require("../models/subjects");
const TextEditor = require("../models/TextEditor");

const { copyLayoutOrPdfFiles } = require("../utils/s3Utils");
// const SchoolYear = require("../models/schoolYear");
// const iconv = require('iconv-lite');
const mongoose = require('mongoose');
// const multer = require('multer');
// const upload = multer();
// const Grid = require('gridfs-stream');
// const gridfs = new Grid(mongoose.connection, { collection: 'pdfFile' });

// const { Readable } = require('stream');

const createLayout_01 = async function (req, res, next) {
    try {
        // ใน express-fileupload, ไฟล์ที่อัปโหลดจะถูกเก็บใน req.files
        // const files = req.files;
        // if (!files || !files.Url || !files.Url[0]) {
        //     return res.status(400).send('ไม่พบไฟล์ "Url1" ที่อัปโหลด');
        // }

        // console.log(_id);


        // const uploadedFile = req.files.Url;
        // console.log(uploadedFile);
        // console.log("--------------------------------")
        // console.log(req.files);

        // แน่ใจว่า Layout1 ถูก require และอ้างถึงในโค้ดของคุณ

        const layoutCounter = req.body.layoutCounter;
        const _id = req.body._id;
        // console.log(req.file)
        const file = req.file;
        const newLayout01 = new Layout1({
            Topic: req.body.Topic,
            MainDescription: req.body.MainDescription,
            SubDescription: req.body.SubDescription,
            AboutImage: [{
                title: req.body.title,
                // file: file.filename,
                file: file.location,
                contentType: file.mimetype,
                ImageDescription: req.body.ImageDescription

            }],
            LessonArrayObject: [{
                LessonId: _id
            }]
        });
        const savedLayout1 = await newLayout01.save();
        const layout01_id = savedLayout1._id;

        // ในส่วนที่ใช้ layoutCounter
        for (let i = 1; i <= layoutCounter; i++) {
            const uploadedFile = req.files[`Url${i}`];

            const updatedContentLayout01 = {
                title: req.body[`title${i}`],
                Url: {
                    data: uploadedFile.data,
                    contentType: uploadedFile.mimetype,
                },
                ImageDescription: req.body[`ImageDescription${i}`]
            };

            await Layout1.findByIdAndUpdate(
                layout01_id,
                { $push: { AboutImage: updatedContentLayout01 } },
                { new: true }
            );
        }

        const getLayout01_Id = savedLayout1._id;
        const updatedLesson = await Lesson.findByIdAndUpdate(
            _id,
            { $push: { LayOut1ArrayObject: getLayout01_Id } },
            { new: true }
        );

        // res.redirect(`/adminIndex/getMoreAddContent?lesson=${_id}`)
        res.redirect(`/adminIndex/eachLessons?lessonId=${_id}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาด");
    }
};
const createLayout_02 = async (req, res) => {
    try {
        const _id = req.body._id;
        console.log(_id);
        const newLayout02 = new Layout2({
            Topic: req.body.Topic,
            TextArea1: req.body.TextArea1,
            TextArea2: req.body.TextArea2,
            TextArea3: req.body.TextArea3,

            LessonArrayObject: [{
                LessonId: _id
            }]
        });

        const savedLayout2 = await newLayout02.save();
        const getLayout02_Id = savedLayout2._id;
        const updatedLesson = await Lesson.findByIdAndUpdate(
            _id,
            { $push: { LayOut2ArrayObject: getLayout02_Id } },
            { new: true }
        );
        // const lessons = await Lesson.find().sort({ createdAt: 1 }).exec();
        // const lesson = await Lesson.findById(_id);

        // res.json(savedLayout1);
        // res.render("getMoreAddContent", { mytitle: "getMoreAddContent", lesson, lessons, foundLayouts });
        res.redirect(`/adminIndex/eachLessons?lessonId=${_id}`);

        // res.redirect(`/adminIndex/getMoreAddContent?lesson=${_id}`)
    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาด");
    }
}


const getMoreAddContent = async (req, res) => {
    try {
        const lessonId = req.query.lesson;
        const lesson = await Lesson.findById(lessonId).populate("schoolYear");

        res.render("getMoreAddContent", { mytitle: "getMoreAddContent", lesson });
        // res.json(lesson);

    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาด");
    }
};

const createLayout03 = async (req, res) => {
    try {
        // รับข้อมูลจากฟอร์ม
        const { _id, Description } = req.body;
        const FileForm = req.file;
        // console.log(FileForm);

        if (!FileForm) {
            return res.status(400).json({ error: 'กรุณาเลือกไฟล์' });
        }

        const newLayout = new Layout3({
            Description: Description,
            // file: FileForm.filename,
            file: FileForm.location,
            contentType: FileForm.mimetype
            ,
            LessonArrayObject: {
                LessonId: _id
            }
        });

        // บันทึกลงในฐานข้อมูล
        const savedLayout = await newLayout.save();
        const getLayout02_Id = savedLayout._id;

        const updatedLesson = await Lesson.findByIdAndUpdate(
            _id,
            { $push: { LayOut3ArrayObject: getLayout02_Id } },
            { new: true }
        );

        // res.redirect(`/adminIndex/getMoreAddContent?lesson=${_id}`)
        res.redirect(`/adminIndex/eachLessons?lessonId=${_id}`);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
};

const createLayout04 = async (req, res) => {
    try {
        // รับข้อมูลจากฟอร์ม
        const { _id, Topic, Description, list, layoutCounter2 } = req.body;
        // const getReq = req.body;
        // console.log(getReq)
        const newLayout04 = new Layout4({
            Topic: Topic,
            Description: Description,
            list: list,
            LessonArrayObject: {
                LessonId: _id
            }
        });

        // บันทึกลงในฐานข้อมูล
        const savedLayout4 = await newLayout04.save();
        const layout04_id = savedLayout4._id;

        for (let i = 1; i <= layoutCounter2; i++) {
            const updatedContentLayout04 = {
                list: req.body[`list${i}`]
            };

            await Layout4.findByIdAndUpdate(
                layout04_id,
                { $push: { Lists: updatedContentLayout04 } },
                { new: true }
            );
        }

        const updatedLesson = await Lesson.findByIdAndUpdate(
            { _id },
            { $push: { LayOut4ArrayObject: layout04_id } },
            { new: true }
        );
        res.redirect(`/adminIndex/eachLessons?lessonId=${_id}`);

        // res.redirect(`/adminIndex/getMoreAddContent?lesson=${_id}`)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
};

const copyLessons = async function (req, res, next) {
    try {
        var { checkedLesson, subjectId } = req.body;
        if (typeof checkedLesson === 'string') {
            // ถ้าเป็น string ให้แปลงเป็น array
            checkedLesson = [checkedLesson];
        }
        for (i of checkedLesson) {
            console.log("เพิ่มครั้งที่: " + i)
            let lesson = await Lesson.findOne({ _id: i })
            // console.log(lesson);
            const newLessonData = lesson.toObject(); // Convert the lesson to a plain JavaScript object
            delete newLessonData._id; // Remove the _id field to create a new one
            delete newLessonData.subject;
            delete newLessonData.lessonQuestion;
            delete newLessonData.comments;
            delete newLessonData.LayOut1ArrayObject;
            delete newLessonData.LayOut2ArrayObject;
            delete newLessonData.LayOut3ArrayObject;
            delete newLessonData.LayOut4ArrayObject;
            delete newLessonData.LayOut5ArrayObject;
            delete newLessonData.TextEditors;
            delete newLessonData.PdfFiles;

            newLessonData._id = new mongoose.Types.ObjectId(); // Use 'new' to create a new ObjectId for the copied document

            const newLesson = new Lesson(newLessonData); // Create a new Lesson instance with the modified data
            // console.log(newLesson);
            if (lesson.file) {
                const originalFilePath = await copyLayoutOrPdfFiles(lesson.file); // ใช้ฟังก์ชัน copyS3File
                
                const newFileName = process.env.AWS_BUCKET_URL+originalFilePath; // สร้างชื่อไฟล์ใหม่
                // console.log('lesson file orginal: '+originalFilePath);

                // const originalFilePath = path.join(__dirname, '../uploads', lesson.file);  // The original file path
                // const newFileName = `copy_${Date.now()}_${path.basename(lesson.file)}`;    // Create a new file name
                // const newFilePath = path.join(__dirname, '../uploads', newFileName);      // The new file path

                // // Copy the file to the new path
                // await fs.promises.copyFile(originalFilePath, newFilePath) // Use promises for async/await
                //     .then(() => {
                //         console.log('File copied successfully:', newFilePath);
                //     })
                //     .catch(err => {
                //         console.error('Error copying file:', err);
                //         return res.status(500).send('Error copying file');
                //     });

                // Update the new lesson's file with the new file location
                newLesson.file = newFileName;
            }

            // // Save the copied lesson document
            await newLesson.save();

            if (lesson.LayOut1ArrayObject.length > 0) {
                const layout1 = lesson.LayOut1ArrayObject;
                for (x of layout1) {
                    let findLayout1 = await Layout1.findOne({ _id: x });
                    const layoutData = findLayout1.toObject(); // Convert the lesson to a plain JavaScript object
                    // console.log(layoutData);
                    delete layoutData._id; // Remove the _id field to create a new one
                    layoutData._id = new mongoose.Types.ObjectId(); // Use 'new' to create a new ObjectId for the copied document
                    const newLayout1 = new Layout1(layoutData); // Create a new Lesson instance with the modified data

                    // const originalFilePath = path.join(__dirname, '../uploads', layoutData.AboutImage[0].file);  // The original file path
                    // const newFileName = `copy_${Date.now()}_${path.basename(layoutData.AboutImage[0].file)}`;    // Create a new file name
                    // const newFilePath = path.join(__dirname, '../uploads', newFileName);      // The new file path

                    // Copy the file to the new path
                    // await fs.promises.copyFile(originalFilePath, newFilePath) // Use promises for async/await
                    //     .then(() => {
                    //         console.log('File copied successfully:', newFilePath);
                    //     })
                    //     .catch(err => {
                    //         console.error('Error copying file:', err);
                    //         return res.status(500).send('Error copying file');
                    //     });

                    // console.log('layout01 file: '+layoutData.AboutImage[0].file);

                    const originalFilePath = await copyLayoutOrPdfFiles(layoutData.AboutImage[0].file); // ใช้ฟังก์ชัน copyS3File
                    // console.log(originalFilePath);
                    const newFileName = process.env.AWS_BUCKET_URL+originalFilePath; // สร้างชื่อไฟล์ใหม่
                    // Update the new lesson's file with the new file location
                    newLayout1.AboutImage[0].file = newFileName;
                    
                    // console.log('layout1 file orginal: '+originalFilePath);
                    // console.log('layout1 file copy: '+newFileName);
                    await newLayout1.save();
                    await Layout1.findByIdAndUpdate(newLayout1._id, { $push: { LessonArrayObject: { LessonId: newLesson._id } } });
                    await Lesson.findByIdAndUpdate(newLesson._id, { $push: {LayOut1ArrayObject: newLayout1._id }})
                }
            }

            if (lesson.LayOut2ArrayObject.length > 0) {
                const layout2 = lesson.LayOut2ArrayObject;
                for (y of layout2) {
                    let findLayout2 = await Layout2.findOne({ _id: y });
                    const layoutData = findLayout2.toObject();
                    // const layoutData = layout2[i].toObject(); 
                    delete layoutData._id;
                    layoutData._id = new mongoose.Types.ObjectId();
                    const newLayout2 = new Layout2(layoutData);
                    await newLayout2.save();
                    await Layout2.findByIdAndUpdate(newLayout2._id, { $push: { LessonArrayObject: { LessonId: newLesson._id } } });
                    await Lesson.findByIdAndUpdate(newLesson._id, { $push: {LayOut2ArrayObject: newLayout2._id }})

                }

            }

            if (lesson.LayOut3ArrayObject.length > 0) {
                const layout3 = lesson.LayOut3ArrayObject;
                for (z of layout3) {
                    let findLayout3 = await Layout3.findOne({ _id: z });
                    const layoutData = findLayout3.toObject();
                    // const layoutData = layout3[i].toObject(); 
                    delete layoutData._id;
                    layoutData._id = new mongoose.Types.ObjectId();
                    const newLayout3 = new Layout3(layoutData);

                    // const originalFilePath = path.join(__dirname, '../uploads', layoutData.file);  // The original file path
                    // const newFileName = `copy_${Date.now()}_${path.basename(layoutData.file)}`;    // Create a new file name
                    // const newFilePath = path.join(__dirname, '../uploads', newFileName);      // The new file path

                    // // Copy the file to the new path
                    // await fs.promises.copyFile(originalFilePath, newFilePath) // Use promises for async/await
                    //     .then(() => {
                    //         console.log('File copied successfully:', newFilePath);
                    //     })
                    //     .catch(err => {
                    //         console.error('Error copying file:', err);
                    //         return res.status(500).send('Error copying file');
                    //     });
                    console.log('layout03 file: '+layoutData.file);

                    const originalFilePath = await copyLayoutOrPdfFiles(layoutData.file); // ใช้ฟังก์ชัน copyS3File
                    const newFileName = process.env.AWS_BUCKET_URL+originalFilePath; // สร้างชื่อไฟล์ใหม่
                    // Update the new lesson's file with the new file location
                    newLayout3.file = newFileName;
                    // console.log('layout3 file orginal: '+originalFilePath);
                    // console.log('layout3 file copy file: '+newFileName);


                    await newLayout3.save();
                    await Layout3.findByIdAndUpdate(newLayout3._id, { $push: { LessonArrayObject: { LessonId: newLesson._id } } });
                    await Lesson.findByIdAndUpdate(newLesson._id, { $push: {LayOut3ArrayObject: newLayout3._id }})

                }

            }

            if (lesson.LayOut4ArrayObject.length > 0) {
                const layout4 = lesson.LayOut4ArrayObject;
                for (a of layout4) {
                    let findLayout4 = await Layout4.findOne({ _id: a });
                    const layoutData = findLayout4.toObject();
                    // const layoutData = layout4[i].toObject(); 
                    delete layoutData._id;
                    layoutData._id = new mongoose.Types.ObjectId();
                    const newLayout4 = new Layout4(layoutData);

                    await newLayout4.save();
                    await Layout4.findByIdAndUpdate(newLayout4._id, { $push: { LessonArrayObject: { LessonId: newLesson._id } } });
                    await Lesson.findByIdAndUpdate(newLesson._id, { $push: {LayOut4ArrayObject: newLayout4._id }})

                }

            }


            if (lesson.PdfFiles.length > 0) {
                const pdfFiles = lesson.PdfFiles;
                for (b of pdfFiles) {
                    let findPdfFile = await pdfFile.findOne({ _id: b });
                    const pdfData = findPdfFile.toObject();
                    // const pdfData = pdfFiles[i].toObject(); 
                    delete pdfData._id;
                    pdfData._id = new mongoose.Types.ObjectId();
                    const newPdfData = new pdfFile(pdfData);

                    // const originalFilePath = path.join(__dirname, '../uploads', pdfData.file);  // The original file path
                    // const newFileName = `copy_${Date.now()}_${path.basename(pdfData.file)}`;    // Create a new file name
                    // const newFilePath = path.join(__dirname, '../uploads', newFileName);      // The new file path

                    // Copy the file to the new path
                    // await fs.promises.copyFile(originalFilePath, newFilePath) // Use promises for async/await
                    //     .then(() => {
                    //         console.log('File copied successfully:', newFilePath);
                    //     })
                    //     .catch(err => {
                    //         console.error('Error copying file:', err);
                    //         return res.status(500).send('Error copying file');
                    //     });
                    // console.log('pdf file: '+pdfData.file);

                    const originalFilePath = await copyLayoutOrPdfFiles(pdfData.file); // ใช้ฟังก์ชัน copyS3File
                    const newFileName = process.env.AWS_BUCKET_URL+originalFilePath; // สร้างชื่อไฟล์ใหม่
                    // Update the new lesson's file with the new file location
                    newPdfData.file = newFileName;
                    // console.log('pdf file orginal: '+originalFilePath);
                    // console.log('pdf file copy file: '+newFileName);


                    await newPdfData.save();
                    await pdfFile.findByIdAndUpdate(newPdfData._id, { $push: { LessonArrayObject: { LessonId: newLesson._id } } });
                    await Lesson.findByIdAndUpdate(newLesson._id, { $push: {PdfFiles: newPdfData._id }})

                }

            }

            if (lesson.TextEditors.length > 0) {
                const TextEditors = lesson.TextEditors;
                for (t of TextEditors) {
                    let textEdi = await TextEditor.findOne({ _id: t });
                    const layoutData = textEdi.toObject();
                    // const layoutData = layout4[i].toObject(); 
                    delete layoutData._id;
                    layoutData._id = new mongoose.Types.ObjectId();
                    const NewTextEditor = new TextEditor(layoutData);

                    await NewTextEditor.save();
                    await TextEditor.findByIdAndUpdate(NewTextEditor._id, { $push: { LessonArrayObject: { LessonId: newLesson._id } } });
                    await Lesson.findByIdAndUpdate(newLesson._id, { $push: {TextEditors: NewTextEditor._id }})

                }

            }

            const subjectUpdate = await Subject.findByIdAndUpdate(subjectId, { $push: { lessonArray: newLesson._id } });
            
            const subjectObject = {
                subjectMongooseId:subjectUpdate._id,
                subjectId:subjectUpdate.subjectId
            }

            const updateNewLesson = await Lesson.findByIdAndUpdate(
                {_id:newLesson._id},
                {
                    $set: {
                        subject:subjectObject
                    }
                },
                {
                    new:true
                }
            )
            // newLesson.subject.subjectMongooseId = subjectUpdate._id;
            // newLesson.subject.subjectId = subjectUpdate.subjectId;

        }
        res.redirect(`/adminIndex/copyLessons?subjectId=${subjectId}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาด");
    }
}

const createLayout_05 = asyncWrapper(async (req, res) => {
    try {
        const { MainDescription } = req.body;
        const file = req.file.path;
        // console.log(file);
        // console.log("Hi");
        const _id = req.body._id;

        const layout5Doc = new Layout5({
            MainDescription,
            file,
            LessonArrayObject: [{
                LessonId: _id
            }]
        });

        await layout5Doc.save();
        const layout05_id = layout5Doc._id;
        const updatedLesson = await Lesson.findByIdAndUpdate(
            _id,
            { $push: { LayOut5ArrayObject: layout05_id } },
            { new: true }
        );

        res.send('ไฟล์ PDF ถูกอัปโหลดและเขียนลงในฐานข้อมูลแล้ว');
    } catch (error) {
        console.error(error);
        res.status(500).send('เกิดข้อผิดพลาดในการอัปโหลดและเขียนลงในฐานข้อมูล');
    }
});

const uploadPdfToLesson = async (req, res) => {
    try {
        const files = req.files;
        const { _id } = req.body;
        // file: files.filename
        const fileData = files.map(files => {
            return {
                contentType: files.mimetype,
                file: files.location
            };
        });

        // for (let i = 0; i < files.length; i++) {
        //     console.log(files.file);
        // }
        fileData.forEach(async (file) => {
            // console.log(file);
            const pdfFiles = new pdfFile({
                contentType: file.contentType,
                file: file.file
            });
            pdfFiles.save();

            const updatedLesson = await Lesson.findByIdAndUpdate(
                _id,
                { $push: { PdfFiles: pdfFiles._id } },
                { new: true }
            );

            const updatedPdfFile = await pdfFile.findByIdAndUpdate(
                pdfFiles._id,
                { $push: { LessonArrayObject: pdfFiles._id } },
                { new: true }
            );
        });

        res.redirect(`/adminIndex/eachLessons?lessonId=${_id}`);

    } catch (err) {
        console.log(err)
    }
}

const addEndQuestionChapter = async (req, res) => {
    // เข้าถึงทุกคำถามในฟอร์ม
    // const body = req.body;
    // const files = req.files;
    res.json(req.files);
    // const reqQuestions = Object.keys(req.body)
    //     .filter(key => key.startsWith('question'))
    //     .map(key => req.body[key]);

    // // ทำสิ่งที่ต้องการกับคำถามเหล่านี้
    // // res.send(questions);
    // const lessonId = req.body.lessonId;
    // const QuestionsArray = [];

    // reqQuestions.forEach((question, index) => {
    //     let eachQuestion = {
    //         questionNo: index + 1,
    //         questionText: question
    //     }
    //     QuestionsArray.push(eachQuestion);

    // });

    // const newQuestions = new lessonQuestion({
    //     Questions: QuestionsArray
    // });
    // await newQuestions.save();

    // const addLessonIdToQuestion = await lessonQuestion.findByIdAndUpdate(
    //     newQuestions._id,
    //     { $push: { Lesson: lessonId } },
    //     { new: true }
    // )

    // const addQuestionIdToLesson = await Lesson.findByIdAndUpdate(
    //     { _id: lessonId },
    //     { $push: { lessonQuestion: newQuestions._id } },
    //     { new: true }
    // )

    // // const findQuestions = await lessonQuestion.find().exec();

    // // if (findQuestions) {
    // //     res.send(findQuestions);
    // // } else {
    // //     res.send("Not found any questions")
    // // }
    // res.redirect(`/adminIndex/eachLessons?lessonId=${lessonId}`);
    // res.send("Add Questions Success");

}

const createTextEditor = async (req, res) => {
    try {
        const { title, body, _id } = req.body;

        const content = new TextEditor({ title, body });
        await content.save();
        const updatedLesson = await Lesson.findByIdAndUpdate(
            _id,
            { $push: { TextEditors: content._id } },
            { new: true }
        );

        const updatedTextEditor = await TextEditor.findByIdAndUpdate(
            content._id,
            { $push: { LessonArrayObject: content._id } },
            { new: true }
        );

        console.log('Save TextEditor Success!!');
        res.redirect(`/adminIndex/eachLessons?lessonId=${_id}`);


    } catch (err) {
        console.log(err);
    }
}
module.exports = {
    createLayout_01,
    getMoreAddContent,
    createLayout_02,
    createLayout03,
    createLayout04,
    createLayout_05,
    copyLessons,
    uploadPdfToLesson,
    addEndQuestionChapter,
    createTextEditor
}
