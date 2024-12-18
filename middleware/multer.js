const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const multerS3 = require('multer-s3');

// สร้าง S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ตั้งค่า multer ให้ใช้งานกับ S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    },
    // ตั้งค่า Content-Type และ Content-Disposition
    contentType: multerS3.AUTO_CONTENT_TYPE, // หรือกำหนดเองเป็น 'application/pdf'
    contentDisposition: 'inline', // เพื่อแสดง PDF ในเบราว์เซอร์
  }),
});

module.exports = upload;

// const aws = require('aws-sdk');
// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const iconv = require("iconv-lite");
// const path = require("path");

// // ตั้งค่า AWS S3
// aws.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,  // ดึงค่า Access Key ID จากไฟล์ .env
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  // ดึงค่า Secret Access Key จากไฟล์ .env
//   region: process.env.AWS_REGION,  // ใส่ region ที่คุณเลือกสำหรับ S3
// });

// const s3 = new aws.S3();

// // ฟังก์ชันกรองไฟล์
// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype.startsWith("image/") ||
//     file.mimetype.startsWith("video/") ||
//     file.mimetype === "application/pdf" ||
//     file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
//     file.mimetype === "application/msword" ||
//     file.mimetype === "application/vnd.ms-powerpoint" ||
//     file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.document" ||
//     file.mimetype === "application/vnd.ms-excel" ||
//     file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// // ตั้งค่า multer ให้ใช้งานกับ S3
// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_BUCKET_NAME,  // ชื่อ bucket ที่คุณสร้างไว้ใน S3
//     acl: 'public-read',  // กำหนดสิทธิ์ให้ไฟล์เป็นแบบ public-read (หรือแก้ไขตามความต้องการ)
//     key: function (req, file, cb) {
//       const timestamp = new Date().toISOString().replace(/:/g, '-'); // แทนที่ ":" เพื่อหลีกเลี่ยงปัญหาใน Windows
//       const originalFilename = file.originalname;
//       const filenameWithoutSpaces = originalFilename.replace(/\s+/g, '_'); // แทนที่ช่องว่างด้วย "_"
//       const filename = iconv.decode(Buffer.from(filenameWithoutSpaces, 'utf-8'), 'utf-8');
//       const finalFilename = timestamp + '_' + filename;
      
//       // ส่งชื่อไฟล์ไปยัง S3
//       cb(null, finalFilename); 
//     }
//   }),
//   fileFilter: fileFilter,
//   limits: { fileSize: 100 * 1024 * 1024 }, // จำกัดขนาดไฟล์ที่ 100MB
// });

// module.exports = upload;


// Code เดิมก่อนจะใช้อัปโหลดบน AWS
// const multer = require("multer");
// const iconv = require("iconv-lite");
// const fs = require("fs");
// const path = require("path");

// // สร้างเส้นทางสำหรับโฟลเดอร์ uploads ที่ root ของโปรเจ็ค
// const uploadDir = path.resolve(__dirname, '..', 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   }, 
//   filename: function (req, file, cb) {
//     const timestamp = new Date().toISOString().replace(/:/g, '-'); // แทนที่ ":" เพื่อหลีกเลี่ยงปัญหาใน Windows
//     const originalFilename = file.originalname;
//     const filenameWithoutSpaces = originalFilename.replace(/\s+/g, '_'); // แทนที่ช่องว่างด้วย "_"
//     const filename = iconv.decode(Buffer.from(filenameWithoutSpaces, 'utf-8'), 'utf-8');
//     const finalFilename = timestamp + '_' + filename;

//     // พิมพ์เส้นทางไฟล์เพื่อการ debug
//     console.log('Saving file to:', path.join(uploadDir, finalFilename));

//     cb(null, finalFilename); // เชื่อมต่อ timestamp กับชื่อไฟล์เข้าด้วยกัน
//   }, 
// });

// const fileFilter = (req, file, cb) => {
//   //reject a file if it's not a jpg, png, video, pdf or word document
//   if (
//     file.mimetype.startsWith("image/") ||
//     file.mimetype.startsWith("video/") ||
//     file.mimetype === "application/pdf" ||
//     file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
//     file.mimetype === "application/msword" ||
//     file.mimetype === "application/vnd.ms-powerpoint" ||
//     file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
//     file.mimetype === "application/vnd.ms-excel" ||
//     file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 100 * 1024 * 1024 }, // จำกัดขนาดไฟล์ที่ 100MB

// });

// module.exports = upload;
