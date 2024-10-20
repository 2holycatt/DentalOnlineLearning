const AWS = require('aws-sdk');
const path = require('path');

// ตั้งค่า AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ฟังก์ชันสำหรับลบไฟล์จาก S3
const deleteFileFromS3 = async (fileLocation) => {
  const bucketName = process.env.AWS_BUCKET_NAME;

  try {
    // ใช้ URL object เพื่อแยก key จาก URL ของไฟล์
    const url = new URL(fileLocation);
    const key = url.pathname.substring(1);  // ตัด '/' ตัวแรกออก

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    // เรียก deleteObject เพื่อลบไฟล์
    await s3.deleteObject(params).promise();
    console.log(`ไฟล์ ${key} ถูกลบเรียบร้อยแล้ว`);
    return { success: true };
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบไฟล์:', error);
    return { success: false, error };
  }
};

// const copyS3File = async (sourceKey, newKey) => {
//   const bucketName = process.env.AWS_BUCKET_NAME;

//   // ดึงไฟล์ต้นฉบับจาก S3
//   const originalFile = await s3.getObject({ Bucket: bucketName, Key: sourceKey }).promise();

//   // อัปโหลดไฟล์ใหม่ด้วยชื่อใหม่
//   await s3.putObject({
//     Bucket: bucketName,
//     Key: newKey,
//     Body: originalFile.Body,
//     ContentType: originalFile.ContentType,
//   }).promise();

//   console.log(`File copied successfully: ${newKey}`);
//   return newKey;
// };

// const copyLayoutOrPdfFiles = async (fileUrl) => {
//   // const newFileName = `${fileKey}_copy_${Date.now()}_`;
//   // const newKey = newFileName;

//   // // ดึงเฉพาะชื่อไฟล์จาก fileKey
//   // const sourceKey = fileKey.split('/').pop(); // แยกชื่อไฟล์จาก URL

//   // console.log(`Copying from ${sourceKey} to ${newKey}`);
//   // await copyS3File(sourceKey, newKey); // คัดลอกไฟล์บน S3
//   // return newFileName;
//    // ดึงเฉพาะชื่อไฟล์ (ไม่รวม path)
//   // ดึงเฉพาะ Key จาก URL
//   const fileKey = fileUrl.split('/').pop(); // แยกเอาชื่อไฟล์ออกจาก URL

//   const fileExtension = fileKey.split('.').pop(); // ดึงนามสกุลไฟล์ เช่น jpg, png
//   const baseFileName = fileKey.slice(0, -(fileExtension.length + 1)); // ชื่อไฟล์ไม่มีนามสกุล

//   // สร้างชื่อใหม่ โดยเติม "_copy_" ก่อนนามสกุล
//   const newFileName = `${baseFileName}_copy_${Date.now()}.${fileExtension}`;

//   // ใช้ชื่อไฟล์ใหม่เป็น Key ใหม่
//   const newKey = newFileName;

//   console.log(`Copying from ${fileKey} to ${newKey}`);

//   // เรียกใช้ฟังก์ชันคัดลอกไฟล์บน S3
//   await copyS3File(fileKey, newKey);

//   return newKey;

// };
// const getFileFromS3 = async (fileKey) => {
//   // ใช้ path.basename เพื่อดึงเฉพาะชื่อไฟล์
//   const originalFileName = path.basename(fileKey); // ดึงชื่อไฟล์
//   console.log(originalFileName); // ตรวจสอบชื่อไฟล์

//   // ปรับ params ให้ใช้ originalFileName แทน
//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: originalFileName, // ใช้ key ที่ถูกต้อง
//   };

//   return s3.getObject(params).promise();
// };
async function copyLayoutOrPdfFiles(originalFileKey) {
  try {
    // แยกชื่อไฟล์เดิม
    const originalFileName = path.basename(originalFileKey);
    const newFileName = `copy_${Date.now()}_${originalFileName}`;

    // สร้าง key ใหม่ (ตำแหน่งใน bucket ที่ต้องการเก็บ)
    // const newFileKey = path.join(path.dirname(originalFileKey), newFileName);
    const newFileKey = newFileName;
    // คัดลอกไฟล์บน S3
    await s3.copyObject({
      Bucket: process.env.AWS_BUCKET_NAME, // ชื่อ bucket ของคุณ
      CopySource: `${originalFileKey}`, // ตำแหน่งไฟล์ต้นฉบับ
      Key: newFileKey, // ตำแหน่งไฟล์ใหม่ 
    }).promise();

    console.log(`Original file key: ${originalFileName}`);
    console.log(`File copied successfully to: ${newFileKey}`);
    return newFileKey; // ส่งกลับตำแหน่งไฟล์ใหม่
  } catch (error) {
    console.error('Error copying file:', error);
    throw new Error('Error copying file');
  }
}


module.exports = { deleteFileFromS3, copyLayoutOrPdfFiles };
