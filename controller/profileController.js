var express = require('express');
const fs = require('fs'); 
const path = require('path'); 
var multer = require('multer');
const { upload, imgUpload } = require('../middleware/multer');
var router = express.Router();
var passport = require('passport');
const Teacher = require("../models/teacher.model");
const Student = require("../models/student.model");
var User = require('../models/user.model');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const profileIndex = async (req, res) => {
  try {
    if (req.session.userId) {
      const isEditPage = req.originalUrl.includes('/edit');
      const userData = await User.findById(req.session.userId);
      if (userData) {
        // ตรวจสอบและดู URL ของรูปโปรไฟล์
        console.log('User image path:', userData.img);
        
        // สร้าง URL เต็มจาก path
        userData.fullImageUrl = userData.img 
          ? `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userData.img}`
          : '/images/example_file/userProfile.png';
          
        console.log('Full image URL:', userData.fullImageUrl);
      }

      const fname = req.session.fname;
      const lname = req.session.lname;
      const nickname = req.session.nickname;
      const notes = req.session.notes;
      const theme = req.session.theme || 'light';
      const isSidebarOpen = false;
      const role = req.session.role; // เพิ่ม role ตรงนี้

      if (userData && userData.img) {
        if (userData.img.startsWith('uploads/') || !userData.img.startsWith('http')) {
          userData.fullImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userData.img}`;
        } else {
          userData.fullImageUrl = userData.img;
        }
      } else if (userData) {
        // กำหนดรูปภาพเริ่มต้น - ถ้าเก็บใน S3 ด้วย ให้เป็น URL เต็ม
        userData.fullImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/example_file/userProfile.png`;
      }
      
      // Render profile.ejs และส่งตัวแปร role ไปด้วย
      if (isEditPage) {
        res.render('edit_profile', 
        { userData,
          theme,
          isSidebarOpen,
          fname,
          lname,
          nickname,
          notes,
          role });
      } else {
        res.render('profile', 
        {  userData,
          theme,
          isSidebarOpen,
          fname,
          lname,
          nickname,
          notes,
          role });
      }
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาด");
  }
};






const editProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

  // ถ้ามีการอัปโหลดไฟล์ใหม่
  if (req.file) {
    // ถ้าผู้ใช้มีรูปโปรไฟล์เก่าใน S3 และไม่ใช่รูปโปรไฟล์เริ่มต้น
    if (user.img && user.img !== 'example_file/userProfile.png') {
      try {
        // ลบไฟล์เก่าออกจาก S3
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: user.img  // เนื่องจากเก็บเป็น path อย่างเดียว
        };
        
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log(`ลบไฟล์เก่า ${user.img} สำเร็จ`);
      } catch (deleteErr) {
        console.error('เกิดข้อผิดพลาดในการลบไฟล์เก่า:', deleteErr);
        // ทำงานต่อไปถึงแม้จะลบไฟล์เก่าไม่สำเร็จ
      }
    }

    // บันทึก path ของไฟล์ใหม่ใน S3 ลงในฐานข้อมูล
    user.img = req.file.key;  // เช่น "uploads/2025-04-03T12-34-56_profile.jpg"
  }
      user.fname = req.body.fname || user.fname;
      user.lname = req.body.lname || user.lname;
      user.nickname = req.body.nickname || user.nickname;
      user.notes = req.body.notes || user.notes;

      await user.save();

    // อัปเดต session
    req.session.fname = user.fname;
    req.session.lname = user.lname;
    req.session.nickname = user.nickname;
    req.session.notes = user.notes;

    res.redirect('/profile');

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message });
  }
}


module.exports = { profileIndex, editProfile };