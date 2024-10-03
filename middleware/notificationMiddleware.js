const Notification = require('../models/notification');

async function loadNotifications(req, res, next) {
    try {
        const unreadNotifications = await Notification.find({ 'notifications.isRead': false }).exec();
        res.locals.hasUnread = unreadNotifications.length > 0;
        next();
    } catch (error) {
        console.error("Error loading notifications:", error);
        res.locals.hasUnread = false; // กำหนดให้ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน
        next();
    }
}

module.exports = loadNotifications;