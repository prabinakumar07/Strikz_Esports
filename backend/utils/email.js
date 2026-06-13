const nodemailer = require('nodemailer');
require('dotenv').config();

// Create nodemailer transporter
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

const sendEmail = async (options) => {
    const mailOptions = {
        from: `Strikz Esports Arena <${process.env.SUPPORT_EMAIL || 'support@strikzesports.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    if (transporter) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[EMAIL] Message sent successfully: ${info.messageId}`);
            return info;
        } catch (err) {
            console.error(`[EMAIL ERROR] Failed to send email: ${err.message}`);
            return null;
        }
    } else {
        console.log('--- [MOCK MAIL SENDER] ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Content: ${mailOptions.text}`);
        console.log('---------------------------');
        return { messageId: 'mock-id-' + Date.now() };
    }
};

module.exports = { sendEmail };
