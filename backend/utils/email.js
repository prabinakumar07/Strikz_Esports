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
    const fromName = process.env.EMAIL_FROM_NAME || 'Strikz Esports Arena';
    const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SUPPORT_EMAIL || 'support@strikzesports.com';
    const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    if (process.env.BREVO_API_KEY) {
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: fromName,
                        email: fromEmail
                    },
                    to: [{ email: mailOptions.to }],
                    subject: mailOptions.subject,
                    htmlContent: mailOptions.html,
                    textContent: mailOptions.text || undefined
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.message || payload.error || `Brevo API failed with status ${response.status}`);
            }

            console.log(`[EMAIL] Brevo message sent successfully: ${payload.messageId || 'sent'}`);
            return { messageId: payload.messageId || `brevo-${Date.now()}` };
        } catch (err) {
            console.error(`[BREVO EMAIL ERROR] Failed to send email: ${err.message}`);
            return null;
        }
    }

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
        console.error('[EMAIL CONFIG ERROR] No email provider configured. Add BREVO_API_KEY, RESEND_API_KEY, or SMTP credentials.');
        return null;
    }
};

module.exports = { sendEmail };
