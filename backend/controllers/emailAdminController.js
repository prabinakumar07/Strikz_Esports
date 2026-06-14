const { models, nextNumberId } = require('../config/db');
const emailService = require('../utils/emailService');

// Helper to generate minimal valid PDF certificate
const generateCertificatePDF = (playerName, tournamentName) => {
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >>
endobj
5 0 obj
<< /Length 250 >>
stream
BT
/F1 26 Tf
100 650 Td
(STRIKZ ESPORTS ARENA) Tj
/F1 18 Tf
0 -60 Td
(CERTIFICATE OF CONFLICT PARTICIPATION) Tj
/F1 14 Tf
0 -40 Td
(This official seal certifies that survivor:) Tj
/F1 20 Tf
0 -35 Td
(${playerName}) Tj
/F1 14 Tf
0 -40 Td
(has successfully competed in and completed the bracket for:) Tj
/F1 16 Tf
0 -30 Td
(${tournamentName}) Tj
/F1 12 Tf
0 -50 Td
(Signed, Strikz Arena Council - 2026) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000220 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
618
%%EOF`;
    return Buffer.from(pdfContent).toString('base64');
};

// 1. Get Email Settings
const getEmailSettings = async (req, res, next) => {
    try {
        let setting = await models.EmailSetting.findOne({ id: 1 }).lean();
        if (!setting) {
            // Seed default settings if empty
            setting = await models.EmailSetting.create({
                id: 1,
                smtpHost: 'smtp.mailtrap.io',
                smtpPort: 2525,
                smtpUser: '',
                smtpPass: '',
                regConfirmation: 'automatic',
                invites: 'automatic',
                reminders: 'automatic',
                attendanceConfirm: 'automatic',
                updates: 'automatic',
                results: 'automatic'
            });
        }
        res.json({ success: true, settings: setting });
    } catch (err) {
        next(err);
    }
};

// 2. Update Email Settings
const updateEmailSettings = async (req, res, next) => {
    try {
        const { 
            smtpHost, smtpPort, smtpUser, smtpPass, 
            regConfirmation, invites, reminders, attendanceConfirm, updates, results 
        } = req.body;

        const setting = await models.EmailSetting.findOneAndUpdate(
            { id: 1 },
            { $set: { 
                smtpHost, smtpPort, smtpUser, smtpPass, 
                regConfirmation, invites, reminders, attendanceConfirm, updates, results 
            } },
            { new: true, upsert: true }
        ).lean();

        res.json({ success: true, message: 'Email settings saved successfully', settings: setting });
    } catch (err) {
        next(err);
    }
};

// 3. Get Email Templates
const getEmailTemplates = async (req, res, next) => {
    try {
        let list = await models.EmailTemplate.find().lean();
        if (list.length === 0) {
            // Seed default email templates
            const defaults = [
                { id: 'otp', name: 'OTP Verification Key', subject: 'Strikz Esports - OTP Account Activation', description: 'Sent immediately during registration to verify accounts.' },
                { id: 'regConfirmation', name: 'Registration Confirmation', subject: 'Registration Confirmed: {{TOURNAMENT}}', description: 'Dispatched to captains and players upon successful registrations.' },
                { id: 'invites', name: 'Tournament Invite', subject: 'Battle Invitation: {{TOURNAMENT}}', description: 'Bulk sent by admin to all registered survivors.' },
                { id: 'attendanceConfirm', name: 'Attendance Lock Request', subject: 'Attendance Lock: {{TOURNAMENT}}', description: 'Requires player confirmation before bracketing.' },
                { id: 'reminders', name: 'Registration & Schedule Reminders', subject: 'Countdown Alert: {{TOURNAMENT}}', description: 'Automated 7d, 3d, 1d reminder transmissions.' },
                { id: 'updates', name: 'Championship Live Updates', subject: 'Tournament Update: {{TYPE}} - {{TOURNAMENT}}', description: 'Rules, schedule overrides, or emergencies.' },
                { id: 'results', name: 'Results & Standings Summary', subject: 'Standings Concluded: {{TOURNAMENT}}', description: 'Winners announcement and PDF certificate attachments.' }
            ];
            for (const item of defaults) {
                await models.EmailTemplate.create(item);
            }
            list = await models.EmailTemplate.find().lean();
        }
        res.json({ success: true, templates: list });
    } catch (err) {
        next(err);
    }
};

// 4. Update Email Template
const updateEmailTemplate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { subject, description } = req.body;

        const template = await models.EmailTemplate.findOneAndUpdate(
            { id },
            { $set: { subject, description } },
            { new: true }
        ).lean();

        if (!template) {
            res.status(404);
            return next(new Error('Template not found'));
        }

        res.json({ success: true, message: 'Template updated successfully', template });
    } catch (err) {
        next(err);
    }
};

// 5. Get Email History Logs
const getEmailHistory = async (req, res, next) => {
    try {
        const logs = await models.EmailLog.find().sort({ sent_at: -1 }).limit(100).lean();
        res.json({ success: true, logs });
    } catch (err) {
        next(err);
    }
};

// 6. Get Email Queue
const getEmailQueue = async (req, res, next) => {
    try {
        const queue = await models.EmailQueue.find().sort({ scheduled_at: 1 }).lean();
        res.json({ success: true, queue });
    } catch (err) {
        next(err);
    }
};

// 7. Resend Failed or Queued Email Immediately
const resendQueueEmail = async (req, res, next) => {
    try {
        const { queueId } = req.body;
        if (!queueId) {
            res.status(400);
            return next(new Error('Queue item ID is required'));
        }

        const item = await models.EmailQueue.findOne({ id: queueId });
        if (!item) {
            res.status(404);
            return next(new Error('Queue item not found'));
        }

        const result = await emailService.sendEmailDirect({
            to: item.to,
            subject: item.subject,
            html: item.html,
            type: item.type,
            attachments: item.attachments
        });

        if (result.success) {
            await models.EmailQueue.deleteOne({ id: queueId });
            res.json({ success: true, message: 'Email sent successfully and removed from queue' });
        } else {
            res.status(500).json({ success: false, message: 'Resend failed: ' + result.error });
        }
    } catch (err) {
        next(err);
    }
};

// 8. Get Email Analytics stats
const getEmailAnalytics = async (req, res, next) => {
    try {
        const totalSent = await models.EmailLog.countDocuments({ status: 'Success' });
        const totalFailed = await models.EmailLog.countDocuments({ status: 'Failed' });
        const totalQueue = await models.EmailQueue.countDocuments();
        
        const typeBreakdown = await models.EmailLog.aggregate([
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            analytics: {
                totalSent,
                totalFailed,
                totalQueue,
                typeBreakdown: typeBreakdown.map(t => ({ type: t._id, count: t.count }))
            }
        });
    } catch (err) {
        next(err);
    }
};

// 9. Send Test Email
const sendTestEmail = async (req, res, next) => {
    try {
        const { toEmail } = req.body;
        if (!toEmail) {
            res.status(400);
            return next(new Error('Recipient test email is required'));
        }

        const result = await emailService.sendEmailDirect({
            to: toEmail,
            subject: 'Strikz Esports - SMTP Integration Test',
            html: '<h3>SMTP CONNECTION ONLINE</h3><p>This is a verification dispatch testing SMTP keys and secure ports. Connection is authorized and operational.</p>',
            type: 'Test Broadcast'
        });

        if (result.success) {
            res.json({ success: true, message: 'Test email successfully dispatched to ' + toEmail });
        } else {
            res.status(500).json({ success: false, message: 'Test send failed: ' + result.error });
        }
    } catch (err) {
        next(err);
    }
};

// 10. Admin: Send bulk invitations
const sendBulkInvite = async (req, res, next) => {
    try {
        const { tournamentId } = req.body;
        if (!tournamentId) {
            res.status(400);
            return next(new Error('Tournament ID is required'));
        }

        const tournament = await models.Tournament.findOne({ id: tournamentId }).lean();
        if (!tournament) {
            res.status(404);
            return next(new Error('Tournament not found'));
        }

        // Get all registered users to broadcast invites
        const users = await models.User.find({ role: 'user' }).lean();

        let count = 0;
        for (const user of users) {
            if (user.email) {
                await emailService.sendTournamentInvitation(user.email, user.username, tournament);
                count++;
            }
        }

        res.json({ success: true, message: `Queued invite emails to ${count} registered players.` });
    } catch (err) {
        next(err);
    }
};

// 11. Admin: Broadcast Tournament Updates (rules, schedules, warnings)
const broadcastTournamentUpdate = async (req, res, next) => {
    try {
        const { tournamentId, updateType, updateMessage } = req.body;
        if (!tournamentId || !updateType || !updateMessage) {
            res.status(400);
            return next(new Error('Tournament ID, updateType, and updateMessage are required'));
        }

        const tournament = await models.Tournament.findOne({ id: tournamentId }).lean();
        if (!tournament) {
            res.status(404);
            return next(new Error('Tournament not found'));
        }

        // Get all registrations for this tournament
        const registrations = await models.Registration.find({ tournament_id: tournamentId }).lean();

        let count = 0;
        for (const reg of registrations) {
            const email = reg.captain_email || reg.player_email;
            const name = reg.captain_name || reg.player_name;
            if (email) {
                await emailService.sendTournamentUpdate(email, name, tournament.name, updateType, updateMessage);
                count++;
            }
        }

        res.json({ success: true, message: `Dispatched update broadcast to ${count} registered team contacts.` });
    } catch (err) {
        next(err);
    }
};

// 12. Admin: Broadcast Results and Winner Certificates
const broadcastResultsAndWinners = async (req, res, next) => {
    try {
        const { tournamentId, winnerName, resultsSummary, generateCertificate } = req.body;
        if (!tournamentId || !winnerName || !resultsSummary) {
            res.status(400);
            return next(new Error('Tournament ID, winnerName and resultsSummary are required'));
        }

        const tournament = await models.Tournament.findOne({ id: tournamentId }).lean();
        if (!tournament) {
            res.status(404);
            return next(new Error('Tournament not found'));
        }

        const registrations = await models.Registration.find({ tournament_id: tournamentId }).lean();

        let count = 0;
        for (const reg of registrations) {
            const email = reg.captain_email || reg.player_email;
            const name = reg.captain_name || reg.player_name;
            if (email) {
                let certificateBase64 = null;
                if (generateCertificate) {
                    certificateBase64 = generateCertificatePDF(name, tournament.name);
                }
                await emailService.sendResultsNotification(email, name, tournament.name, winnerName, resultsSummary, certificateBase64);
                count++;
            }
        }

        res.json({ success: true, message: `Dispatched concluding brackets email to ${count} registrations.` });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getEmailSettings,
    updateEmailSettings,
    getEmailTemplates,
    updateEmailTemplate,
    getEmailHistory,
    getEmailQueue,
    resendQueueEmail,
    getEmailAnalytics,
    sendTestEmail,
    sendBulkInvite,
    broadcastTournamentUpdate,
    broadcastResultsAndWinners
};
