const { models } = require('../config/db');
const emailService = require('./emailService');

// 1. Process Pending Email Queue
const processQueue = async () => {
    try {
        const pending = await models.EmailQueue.find({
            status: 'Pending',
            scheduled_at: { $lte: new Date().toISOString() }
        })
        .limit(10) // batch limit to prevent email spam filters / rate limits
        .lean();

        for (const item of pending) {
            // Update status to processing to avoid duplicate sending
            await models.EmailQueue.updateOne({ id: item.id }, { $set: { status: 'Sending' } });
            
            const result = await emailService.sendEmailDirect({
                to: item.to,
                subject: item.subject,
                html: item.html,
                type: item.type,
                attachments: item.attachments
            });

            if (result.success) {
                // Remove from queue or update status
                await models.EmailQueue.deleteOne({ id: item.id });
            } else {
                const attempts = (item.attempts || 0) + 1;
                if (attempts >= 3) {
                    // Fail permanently
                    await models.EmailQueue.updateOne(
                        { id: item.id }, 
                        { $set: { status: 'Failed', attempts, error_message: result.error } }
                    );
                } else {
                    // Put back to pending with delay
                    const nextRetry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // retry in 5 mins
                    await models.EmailQueue.updateOne(
                        { id: item.id }, 
                        { $set: { status: 'Pending', attempts, scheduled_at: nextRetry, error_message: result.error } }
                    );
                }
            }
        }
    } catch (e) {
        console.error('[SCHEDULER ERROR] Queue processing failed:', e.message);
    }
};

// 2. Check and Dispatch Tournament Reminders
const checkTournamentReminders = async () => {
    try {
        const now = new Date();
        
        // Find all active tournaments
        const tournaments = await models.Tournament.find({ status: 'Open' }).lean();

        for (const tourney of tournaments) {
            const tourneyDate = new Date(tourney.startDate);
            const diffTime = tourneyDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Find all registrations for this tournament
            const registrations = await models.Registration.find({ tournament_id: tourney.id }).lean();

            for (const reg of registrations) {
                const email = reg.captain_email || reg.player_email;
                const name = reg.captain_name || reg.player_name;
                
                if (!email) continue;
                
                // Initialize reminders sent object if not present
                const remindersSent = reg.remindersSent || {};
                let updated = false;

                // A. 7-Day Registration / Schedule reminder
                if (diffDays === 7 && !remindersSent['7d']) {
                    await emailService.sendRegistrationReminder(email, name, tourney, 7);
                    remindersSent['7d'] = true;
                    updated = true;
                }
                
                // B. 3-Day Registration / Schedule reminder
                if (diffDays === 3 && !remindersSent['3d']) {
                    await emailService.sendRegistrationReminder(email, name, tourney, 3);
                    remindersSent['3d'] = true;
                    updated = true;
                }

                // C. 1-Day Registration / Venue reminder
                if (diffDays === 1 && !remindersSent['1d']) {
                    await emailService.sendRegistrationReminder(email, name, tourney, 1);
                    remindersSent['1d'] = true;
                    updated = true;
                }

                if (updated) {
                    await models.Registration.updateOne(
                        { id: reg.id },
                        { $set: { remindersSent } }
                    );
                }

                // D. Check Attendance Reminders (Pending Confirmation)
                // Wait, only check if registration status is 'Pending'
                if (reg.status === 'Pending') {
                    const submissionDate = new Date(reg.submission_date || reg.created_at);
                    const hoursSinceSubmission = (now - submissionDate) / (1000 * 60 * 60);
                    
                    const attendanceReminders = reg.attendanceReminders || {};
                    let attUpdated = false;

                    // 1. Send reminder after 24 hours from submission if still pending
                    if (hoursSinceSubmission >= 24 && !attendanceReminders['24h']) {
                        await emailService.sendAttendanceReminder(email, name, reg.id, tourney.name, 24);
                        attendanceReminders['24h'] = true;
                        attUpdated = true;
                    }

                    // 2. Send reminder 48 hours before the tournament
                    const hoursToTourney = diffTime / (1000 * 60 * 60);
                    if (hoursToTourney <= 48 && hoursToTourney > 0 && !attendanceReminders['48h']) {
                        await emailService.sendAttendanceReminder(email, name, reg.id, tourney.name, 48);
                        attendanceReminders['48h'] = true;
                        attUpdated = true;
                    }

                    if (attUpdated) {
                        await models.Registration.updateOne(
                            { id: reg.id },
                            { $set: { attendanceReminders } }
                        );
                    }
                }
            }
        }
    } catch (e) {
        console.error('[SCHEDULER ERROR] Tournament reminders failed:', e.message);
    }
};

// Start the scheduler loops
const startEmailScheduler = () => {
    console.log('[SCHEDULER] Strikz Esports Email Scheduler online.');
    
    // Process queue every 1 minute
    setInterval(processQueue, 60 * 1000);
    
    // Scan tournament reminders every 1 hour
    setInterval(checkTournamentReminders, 60 * 60 * 1000);
    
    // Trigger initial runs in background
    setTimeout(processQueue, 5000);
    setTimeout(checkTournamentReminders, 15000);
};

module.exports = { startEmailScheduler };
