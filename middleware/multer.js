const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const multerS3 = require('multer-s3');
const iconv = require("iconv-lite");
const fs = require("fs");
const path = require("path");


// สร้าง S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const s3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  key: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filenameWithoutSpaces = file.originalname.replace(/\s+/g, '_');
    // เพิ่ม path "uploads/" ด้านหน้า
    const key = `uploads/${timestamp}_${filenameWithoutSpaces}`;
    cb(null, key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  acl: 'public-read'  // ให้ไฟล์สามารถอ่านได้แบบสาธารณะ
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

const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

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


// สร้าง multer middleware สำหรับการอัปโหลดทั่วไป
const upload = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 100MB
});

// สร้าง multer middleware สำหรับการอัปโหลดเฉพาะรูปภาพ
const imgUpload = multer({
  storage: s3Storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('อนุญาติแค่ไฟล์ .png, .jpg และ .jpeg เท่านั้น'));
    }
  },
  onError: function(err, next) {
    console.log('error', err);
    next(err);
  }
});

module.exports = { upload, imgUpload };

