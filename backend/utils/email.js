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
        from: `Strikz Esports Arena <${process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SUPPORT_EMAIL || 'support@strikzesports.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    if (process.env.RESEND_API_KEY) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: mailOptions.from,
                    to: [mailOptions.to],
                    subject: mailOptions.subject,
                    html: mailOptions.html,
                    text: mailOptions.text || undefined
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.message || payload.error || `Resend API failed with status ${response.status}`);
            }

            console.log(`[EMAIL] Resend message sent successfully: ${payload.id}`);
            return { messageId: payload.id };
        } catch (err) {
            console.error(`[RESEND EMAIL ERROR] Failed to send email: ${err.message}`);
            return null;
        }
    }

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
        console.error('[EMAIL CONFIG ERROR] No email provider configured. Add RESEND_API_KEY or SMTP credentials.');
        return null;
    }
};

module.exports = { sendEmail };
