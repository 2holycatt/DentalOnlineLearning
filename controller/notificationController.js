const Notification = require("../models/notification");
const { format } = require('date-fns-tz');

const createNotification = async (userId, userName, about, req, res, next) => {
    try {
        const currentTime = new Date();
        const thaiTime = format(currentTime, 'dd MMMM yyyy', { timeZone: 'Asia/Bangkok' });
        const months = {
            "January": "มกราคม",
            "February": "กุมภาพันธ์",
            "March": "มีนาคม",
            "April": "เมษายน",
            "May": "พฤษภาคม",
            "June": "มิถุนายน",
            "July": "กรกฎาคม",
            "August": "สิงหาคม",
            "September": "กันยายน",
            "October": "ตุลาคม",
            "November": "พฤศจิกายน",
            "December": "ธันวาคม"
        }

        const options = {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
        };

        const thaiHour = currentTime.toLocaleTimeString('th-TH', options);


        const [day, monthNum, year] = thaiTime.split(' ');
        const yearParse = parseInt(year, 10);
        // เช็คเดือนจากตัวแปร months
        const monthName = months[monthNum];
        // console.log(thaiTime)
        // console.log(day, monthNum, year)

        const formattedDate = `${day} ${monthName} ${yearParse + 543}`;

        const checkExists = await Notification.findOne({ date: formattedDate });
        console.log(checkExists);
        if (checkExists) {
            const updateNotification = {
                about: about,
                name: userName,
                user: userId,
                time: thaiHour
            }

            const updatedNoti = await Notification.findByIdAndUpdate(
                checkExists._id,
                { $push: { notifications: updateNotification } },
                { new: true }
            );
        } else if (!checkExists) {
            const createNotification = new Notification(
                {
                    date: formattedDate,
                    notifications: [
                        {
                            about: about,
                            name: userName,
                            user: userId,
                            time: thaiHour
                        }
                    ]
                }
            )
            await createNotification.save()
        }


    } catch (err) {
        console.error(err);
    }

};

const markAsRead = async (req, res) => {
    const index = req.query.index; // รับ index จาก body ของ request
    const notificationId = req.query.notiId; // รับ ID ของ collection Notification จาก body ของ request

    try {
        // ดึงข้อมูลการแจ้งเตือน
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // ตรวจสอบ index
        if (index < 0 || index >= notification.notifications.length) {
            return res.status(400).json({ message: 'Invalid index' });
        }

        // อัปเดตสถานะ `isRead`
        notification.notifications[index].isRead = true;

        // บันทึกการเปลี่ยนแปลง
        await notification.save();

        // ส่ง response ว่าการอัปเดตเสร็จสิ้น
        res.redirect('/adminIndex/teacherNotification')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error marking notification as read' });
    }
};


const markAsReadAll = async (req, res) => {
    try {
        await Notification.updateMany(
            { 'notifications.isRead': false },
            { '$set': { 'notifications.$[].isRead': true } }
        );
        // res.status(200).json({ message: 'All notifications marked as read' });
        res.redirect('/adminIndex/teacherNotification')
    } catch (error) {
        res.status(500).json({ message: 'Error marking notifications as read', error });
    }
};


module.exports = {
    createNotification,
    markAsReadAll,
    markAsRead
};