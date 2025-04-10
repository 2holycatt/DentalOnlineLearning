const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const multerS3 = require('multer-s3');
const iconv = require("iconv-lite");
const fs = require("fs");
const path = require("path");


const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const questionImageDir = path.join(__dirname, '../public/uploads/questions');
if (!fs.existsSync(questionImageDir)) {
    fs.mkdirSync(questionImageDir, { recursive: true });
}

const questionImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, questionImageDir);
  },
  filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// สร้าง multer instance สำหรับรูปภาพคำถาม
const uploadQuestionImage = multer({
  storage: questionImageStorage,
  limits: {
      fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ที่ 5MB
  },
  fileFilter: (req, file, cb) => {
      // ตรวจสอบประเภทไฟล์
      if (file.mimetype.startsWith('image/')) {
          cb(null, true);
      } else {
          cb(new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น'));
      }
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  }, 
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/:/g, '-'); // แทนที่ ":" เพื่อหลีกเลี่ยงปัญหาใน Windows
    const originalFilename = file.originalname;
    const filenameWithoutSpaces = originalFilename.replace(/\s+/g, '_'); // แทนที่ช่องว่างด้วย "_"
    const filename = iconv.decode(filenameWithoutSpaces, 'utf-8'); // ถอดรหัสจาก originalName เป็น utf-8 (ภาษาไทย)
    const finalFilename = timestamp + '_' + filename;

    // พิมพ์เส้นทางไฟล์เพื่อการ debug
    console.log('Saving file to:', path.join(uploadDir, finalFilename));

    cb(null, finalFilename); // เชื่อมต่อ timestamp กับชื่อไฟล์เข้าด้วยกัน
  },
});

const fileFilter = (req, file, cb) => {
  //reject a file if it's not a jpg, png, video, pdf or word document
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword" || 
    file.mimetype === 'application/vnd.ms-excel' || 
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

const imgUpload = (destination) =>multer({
  storage: storage(destination),
  limits: {
    fileSize: 2* 1024 * 1024, //2mb,

  },
  fileFilter: (req, file, cb) =>{
    if(file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.
      mimetype == "image/jpeg") {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('อนุญาติแค่ไฟล์ .png, .jpg และ .jpeg เท่านั้น'));
      }
  },
  onError : function(err, next) {
    return console.log('error', err);
    next(err);
  }
})


module.exports = {upload,
                  uploadQuestionImage
                };

