const nodemailer = require('nodemailer');

async function sendEmail(email, subject, name, username, whatCome, subjectName) {
    if (email.includes('@')) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'papinwit.s@kkumail.com',
                pass: 'akid mrnc zrey xzrd'
            }
        });

        let info = await transporter.sendMail({
            from: 'papinwit.s@kkumail.com',
            to: email,
            subject: subject,
            // text: 'บทเรียนถูกเพิ่มแล้ว'
            html:
                `
            <style>
        a {
            background-color: #8A2BE2;
            color: white;
        }
        a:hover {
            background-color: white;
            transition: 0.3s;
            transition-duration: 0.3s;
            color: #8A2BE2;
        }
    </style>
    <div style="display: grid; flex-direction: row; padding: 1.5rem; background-color: #ffffff; margin: 1em auto; border: 1px solid #EAEFF4;
             border-radius:0.5em; width:fit-content; grid-template-columns: 1fr;">
      <div>
        <div style="display: flex; justify-content: center;">
            <img style="width: 75%; height: auto;" src="https://dentistry.kku.ac.th/wp-content/uploads/2022/04/logo_head2-mobile-tqc.png" alt="โลโก้ คณะทันตแพทยศาสตร์ มหาวิทยาลัยขอนแก่น">
        </div>
        <div style="display: flex; justify-content: center; border-bottom: 1px solid #EAEFF4;">
            <h1>Online dentistry Learning Khon Kaen University</h1>
        </div>
      </div>
      <div style="border-bottom: 1px solid #EAEFF4; margin-bottom:1em;">
        <h3>ถึงคุณ ${email}</h3>
        <p>${whatCome} <span style="font-weight: bold; color: #007bff;">${name}</span> ถูกเพิ่มใหม่ลงใน Online Dentristy Learning</p>
        <p><span style="font-weight:bold ;">รายวิชา: </span> ${subjectName}</p>
        <p> <span style="font-weight: bold;">โดย: </span>ดร. ${username}</p>
      </div>
      <div style="display: flex; justify-content: center;">
        <a href="http://localhost:4000/" style="padding: 0.5em; border: 1px solid #8A2BE2;
        border-radius: 0.5em; text-decoration: none;
        background-color: #8A2BE2;
        color: white;">เข้าสู่เว็ปไซต์</a>
      </div>
    </div>
            `
        });
        console.log('Message sent: %s', info.messageId);
    }
}


module.exports = { sendEmail };
