const multer = require("multer");
const iconv = require("iconv-lite");
const fs = require("fs");
const path = require("path");

// สร้างเส้นทางสำหรับโฟลเดอร์ uploads ที่ root ของโปรเจ็ค
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

const fileFilter = (req, file, cb) => {
  //reject a file if it's not a jpg, png, video, pdf or word document
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.ms-powerpoint" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // จำกัดขนาดไฟล์ที่ 100MB

});

module.exports = upload;
