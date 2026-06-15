const { models } = require('../config/db');
const emailService = require('./emailService');

// 1. Process Pending Email Queue
const processQueue = async () => {
    try {
        const pending = await models.EmailQueue.find({
            status: 'Pending',
            scheduled_at: { $lte: new Date().toISOString() }
        })
        .limit(10)
        .lean();

        for (const item of pending) {
            await models.EmailQueue.updateOne({ id: item.id }, { $set: { status: 'Sending' } });

            const result = await emailService.sendEmailDirect({
                to: item.to,
                subject: item.subject,
                html: item.html,
                type: item.type,
                attachments: item.attachments
            });

            if (result && result.success) {
                await models.EmailQueue.deleteOne({ id: item.id });
            } else {
                const attempts = (item.attempts || 0) + 1;
                if (attempts >= 3) {
                    await models.EmailQueue.updateOne(
                        { id: item.id },
                        { $set: { status: 'Failed', attempts, error_message: result ? result.error : 'Unknown error' } }
                    );
                } else {
                    const nextRetry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
                    await models.EmailQueue.updateOne(
                        { id: item.id },
                        { $set: { status: 'Pending', attempts, scheduled_at: nextRetry, error_message: result ? result.error : 'Unknown error' } }
                    );
                }
            }
        }
    } catch (e) {
        console.error('[SCHEDULER ERROR] Queue processing failed:', e.message);
    }
};

// 2. Check and Dispatch Tournament Reminders — Fixed N+1 queries
const checkTournamentReminders = async () => {
    try {
        const now = new Date();

        // Batch fetch all open tournaments in one query
        const tournaments = await models.Tournament.find({ status: 'Open' }).lean();
        if (tournaments.length === 0) return;

        // Batch fetch all registrations for all open tournaments in one query
        const tournamentIds = tournaments.map((t) => t.id);
        const allRegistrations = await models.Registration.find({
            tournament_id: { $in: tournamentIds }
        }).lean();

        if (allRegistrations.length === 0) return;

        // Process in parallel groups
        for (const tourney of tournaments) {
            const tourneyDate = new Date(tourney.startDate);
            const diffTime = tourneyDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Filter registrations for this tournament
            const registrations = allRegistrations.filter((r) => r.tournament_id === tourney.id);

            for (const reg of registrations) {
                const email = reg.captain_email || reg.player_email;
                const name = reg.captain_name || reg.player_name;
                if (!email) continue;

                const remindersSent = reg.remindersSent || {};
                let updated = false;

                if (diffDays === 7 && !remindersSent['7d']) {
                    await emailService.sendRegistrationReminder(email, name, tourney, 7);
                    remindersSent['7d'] = true;
                    updated = true;
                }
                if (diffDays === 3 && !remindersSent['3d']) {
                    await emailService.sendRegistrationReminder(email, name, tourney, 3);
                    remindersSent['3d'] = true;
                    updated = true;
                }
                if (diffDays === 1 && !remindersSent['1d']) {
                    await emailService.sendRegistrationReminder(email, name, tourney, 1);
                    remindersSent['1d'] = true;
                    updated = true;
                }

                if (updated) {
                    await models.Registration.updateOne({ id: reg.id }, { $set: { remindersSent } });
                }

                if (reg.status === 'Pending') {
                    const submissionDate = new Date(reg.submission_date || reg.created_at);
                    const hoursSinceSubmission = (now - submissionDate) / (1000 * 60 * 60);
                    const attendanceReminders = reg.attendanceReminders || {};
                    let attUpdated = false;

                    if (hoursSinceSubmission >= 24 && !attendanceReminders['24h']) {
                        await emailService.sendAttendanceReminder(email, name, reg.id, tourney.name, 24);
                        attendanceReminders['24h'] = true;
                        attUpdated = true;
                    }

                    const hoursToTourney = diffTime / (1000 * 60 * 60);
                    if (hoursToTourney <= 48 && hoursToTourney > 0 && !attendanceReminders['48h']) {
                        await emailService.sendAttendanceReminder(email, name, reg.id, tourney.name, 48);
                        attendanceReminders['48h'] = true;
                        attUpdated = true;
                    }

                    if (attUpdated) {
                        await models.Registration.updateOne({ id: reg.id }, { $set: { attendanceReminders } });
                    }
                }
            }
        }
    } catch (e) {
        console.error('[SCHEDULER ERROR] Tournament reminders failed:', e.message);
    }
};

// Start the scheduler — keep references to clear on graceful shutdown
let queueInterval = null;
let reminderInterval = null;

const startEmailScheduler = () => {
    console.log('[SCHEDULER] Strikz Esports Email Scheduler online.');

    queueInterval = setInterval(processQueue, 60 * 1000);
    reminderInterval = setInterval(checkTournamentReminders, 60 * 60 * 1000);

    setTimeout(processQueue, 5000);
    setTimeout(checkTournamentReminders, 15000);
};

// Graceful shutdown — clears intervals to prevent memory leaks
const stopEmailScheduler = () => {
    if (queueInterval) clearInterval(queueInterval);
    if (reminderInterval) clearInterval(reminderInterval);
    console.log('[SCHEDULER] Email scheduler stopped.');
};

// Handle process signals for clean shutdown
process.on('SIGTERM', stopEmailScheduler);
process.on('SIGINT', stopEmailScheduler);

module.exports = { startEmailScheduler, stopEmailScheduler };
