

// ตั้งค่าและใช้งาน winston
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
// const logFormat = printf(({ level, message, timestamp }) => {
//     // แยกข้อมูล Browser จาก User Agent
//     const browserMatch = message.match(/User Agent:.*?(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)\/[\d.]+/);
//     const browser = browserMatch ? browserMatch[1] : 'Unknown Browser';

//     // แยกข้อมูล IP, Event, และ Email จาก message
//     const ipMatch = message.match(/IP: (.*?)(,|$)/);
//     const eventMatch = message.match(/(.*?):/);
//     const emailMatch = message.match(/, Email: (.*?)(,|$)/);

//     const ip = ipMatch ? ipMatch[1] : 'N/A';
//     const event = eventMatch ? eventMatch[1] : 'N/A';
//     const email = emailMatch ? emailMatch[1] : 'N/A';

//     // สร้าง log format ตามที่ต้องการ
//     return `${timestamp} ${level}: IP: ${ip}, Event: ${event}, Email: ${email}, Browser: ${browser}`;
// });

const logger = createLogger({
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/app.log' })
    ]
});

module.exports = logger;
