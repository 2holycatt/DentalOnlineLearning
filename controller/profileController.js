var express = require('express');
const fs = require('fs'); 
const path = require('path'); 
var multer = require('multer');
const imgUpload = require('../middleware/multer'); // นำเข้า middleware multer
var router = express.Router();
var passport = require('passport');
const Teacher = require("../models/teacher.model");
const Student = require("../models/student.model");
var User = require('../models/user.model');



const profileIndex = async (req, res) => {
  try {
    if (req.session.userId) {
      const isEditPage = req.originalUrl.includes('/edit');
      const userData = await User.findById(req.session.userId);
      const fname = req.session.fname;
      const lname = req.session.lname;
      const nickname = req.session.nickname;
      const notes = req.session.notes;
      const theme = req.session.theme || 'light';
      const isSidebarOpen = false;
      const role = req.session.role; // เพิ่ม role ตรงนี้

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

    // ถ้ามีไฟล์ใหม่ให้ลบไฟล์เก่า
    if (req.file) {
      if (user.img) {
        const oldImagePath = path.join(__dirname, '..', 'uploads', user.img);
        // ลบไฟล์เก่าหากมี
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error('Error deleting old image:', err);
          }
        });
      }

      const img = req.file.filename;
      user.fname = req.body.fname || user.fname;
      user.lname = req.body.lname || user.lname;
      user.nickname = req.body.nickname || user.nickname;
      user.notes = req.body.notes || user.notes;
      user.img = img; // บันทึกชื่อไฟล์ใหม่
      await user.save();
    } else {
      // ถ้าไม่มีไฟล์ใหม่ก็อัปเดตข้อมูลอื่นๆ
      user.fname = req.body.fname || user.fname;
      user.lname = req.body.lname || user.lname;
      user.nickname = req.body.nickname || user.nickname;
      user.notes = req.body.notes || user.notes;
      await user.save();
    }

    res.redirect('/profile');

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err.message });
  }
}


module.exports = { profileIndex, editProfile };