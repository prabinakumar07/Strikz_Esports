const { models } = require('../config/db');
const { sendEmail } = require('../utils/email');

const createTicket = async (req, res, next) => {
    try {
        const { senderName, senderEmail, message, type } = req.body;

        if (!senderName || !senderEmail || !message) {
            res.status(400);
            return next(new Error('Please enter name, email and message details'));
        }

        let ticketId;
        do {
            ticketId = 'CHAT-' + Math.floor(100 + Math.random() * 900);
        } while (await models.ChatbotTicket.exists({ id: ticketId }));

        const dateString = new Date().toLocaleString();
        await models.ChatbotTicket.create({
            id: ticketId,
            senderName,
            senderEmail,
            message,
            date: dateString,
            status: 'Pending',
            type: type || 'Player'
        });

        await sendEmail({
            to: process.env.SUPPORT_EMAIL || 'support@strikzesports.com',
            subject: `[Strikz Esports] New support ticket filed: ${ticketId}`,
            text: `A new support ticket has been filed by ${senderName} (${senderEmail}) via Strikz Portal.\n\nTicket ID: ${ticketId}\nMessage: ${message}`,
            html: `<div style="font-family: sans-serif; background: #05050a; color: #fff; padding: 25px; border-radius: 6px; border: 1px solid #00f0ff;">
                     <h3 style="color: #00f0ff; margin-top: 0;">STRIKZ PORTAL - SUPPORT DISPATCH</h3>
                     <p><strong>Ticket ID:</strong> ${ticketId}</p>
                     <p><strong>Gamer/Sender:</strong> ${senderName} (${senderEmail})</p>
                     <p><strong>Message:</strong></p>
                     <blockquote style="background: rgba(255,255,255,0.05); padding: 12px; border-left: 3px solid #00f0ff; color: #ccc;">${message}</blockquote>
                   </div>`
        });

        res.status(201).json({
            success: true,
            ticket: { id: ticketId, senderName, senderEmail, message, date: dateString, status: 'Pending', type: type || 'Player' }
        });
    } catch (err) {
        next(err);
    }
};

const createPartnerInquiry = async (req, res, next) => {
    try {
        const { company, contact, email, phone, instagram, tier, message } = req.body;

        if (!company || !contact || !email || !message) {
            res.status(400);
            return next(new Error('Please enter all required partnership details'));
        }

        let inquiryId;
        do {
            inquiryId = 'PARTNER-' + Math.floor(1000 + Math.random() * 9000);
        } while (await models.ChatbotTicket.exists({ id: inquiryId }));

        const dateString = new Date().toLocaleString();
        const fullMessage = `[Partner Inquiry]\nCompany: ${company}\nTier of Interest: ${tier}\nPhone: ${phone || 'N/A'}\nInstagram: ${instagram || 'N/A'}\n\nCollaboration Pitch:\n${message}`;

        await models.ChatbotTicket.create({
            id: inquiryId,
            senderName: contact,
            senderEmail: email,
            message: fullMessage,
            date: dateString,
            status: 'Pending',
            type: 'Partner'
        });

        await sendEmail({
            to: process.env.PARTNER_EMAIL || 'partners@strikzesports.com',
            subject: `[B2B Partnership] New inquiry filed: ${company} (${inquiryId})`,
            text: `A new partnership inquiry has been received from ${contact} of ${company}.\n\nInquiry ID: ${inquiryId}\nWork Email: ${email}\nPhone: ${phone || 'N/A'}\nInterest: ${tier} Sponsor\nPitch Details: ${message}`,
            html: `<div style="font-family: sans-serif; background: #05050a; color: #fff; padding: 25px; border-radius: 6px; border: 1px solid #ff5e00;">
                     <h3 style="color: #ff5e00; margin-top: 0;">STRIKZ PORTAL - B2B RELATIONS ALERT</h3>
                     <p><strong>Inquiry ID:</strong> ${inquiryId}</p>
                     <p><strong>Company:</strong> ${company}</p>
                     <p><strong>Contact:</strong> ${contact} (${email})</p>
                     <p><strong>Tier of Interest:</strong> ${tier}</p>
                     <blockquote style="background: rgba(255,255,255,0.05); padding: 12px; border-left: 3px solid #ff5e00; color: #ccc;">${message}</blockquote>
                   </div>`
        });

        res.status(201).json({
            success: true,
            inquiry: { id: inquiryId, company, contact, email, phone, instagram, tier, message, date: dateString }
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createTicket,
    createPartnerInquiry
};
