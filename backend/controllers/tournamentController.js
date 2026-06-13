const { models, nextNumberId, clean } = require('../config/db');

const sortByIdDesc = (a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const publicDoc = (doc) => clean(doc);

const getPublicSnapshot = async (req, res, next) => {
    try {
        const [tournaments, sponsors, gallery, news, roster, achievements, management, socialFeed, settings] = await Promise.all([
            models.Tournament.find().sort({ startDate: 1 }).lean(),
            models.Sponsor.find().sort({ tier: -1, name: 1 }).lean(),
            models.Gallery.find().sort({ id: -1 }).lean(),
            models.News.find().sort({ created_at: -1 }).lean(),
            models.Roster.find().lean(),
            models.Achievement.find().sort({ id: -1 }).lean(),
            models.Management.find().sort({ id: 1 }).lean(),
            models.SocialFeed.find().sort({ id: -1 }).lean(),
            models.Setting.findOne({ id: 1 }).lean()
        ]);

        res.json({
            success: true,
            data: {
                tournaments: tournaments.map(publicDoc),
                sponsors: sponsors.map(publicDoc),
                gallery: gallery.map(publicDoc),
                news: news.map(publicDoc),
                roster: roster.map(publicDoc),
                achievements: achievements.map(publicDoc),
                management: management.map(publicDoc),
                socialFeed: socialFeed.map(publicDoc),
                settings: publicDoc(settings) || {}
            }
        });
    } catch (err) {
        next(err);
    }
};

const trackRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;
        const reg = await models.Registration.findOne({ id }).lean();

        if (!reg) {
            res.status(404);
            return next(new Error('Gamer registration ticket code not found'));
        }

        const [players, tourney] = await Promise.all([
            models.RegistrationPlayer.find({ registration_id: id }).select('name game_uid role confirmed real_name').lean(),
            models.Tournament.findOne({ id: reg.tournament_id }).select('name image').lean()
        ]);

        res.json({
            success: true,
            registration: {
                id: reg.id,
                type: reg.type,
                tournamentId: reg.tournament_id,
                tournamentName: tourney ? tourney.name : '',
                tournamentImage: tourney ? tourney.image : '',
                status: reg.status,
                stage: reg.stage,
                submissionDate: reg.submission_date,
                teamName: reg.team_name,
                captainName: reg.captain_name,
                playerName: reg.player_name,
                gameUid: reg.game_uid,
                role: reg.role,
                players: players.map(publicDoc)
            }
        });
    } catch (err) {
        next(err);
    }
};

const createRegistration = async (req, res, next) => {
    try {
        const { type, tournamentId, teamName, captainName, captainEmail, captainPhone, players, playerName, gameUid, playerEmail, playerPhone, role } = req.body;

        if (!type || !tournamentId) {
            res.status(400);
            return next(new Error('Registration requires type and tournament target'));
        }

        const tourney = await models.Tournament.findOne({ id: tournamentId }).lean();
        if (!tourney) {
            res.status(404);
            return next(new Error('Tournament arena not found'));
        }

        if (tourney.status !== 'Open') {
            res.status(400);
            return next(new Error('Championship registration portal is currently closed'));
        }

        if (type === 'Solo' && !tourney.soloRegistrationEnabled) {
            res.status(400);
            return next(new Error('Solo entries are restricted for this championship'));
        }

        let regId;
        do {
            regId = 'REG-' + Math.floor(10000 + Math.random() * 90000);
        } while (await models.Registration.exists({ id: regId }));

        const submissionDate = new Date().toISOString().slice(0, 10);
        const baseRegistration = {
            id: regId,
            type,
            tournament_id: tournamentId,
            status: 'Pending',
            stage: type === 'Solo' ? 2 : 1,
            submission_date: submissionDate
        };

        if (type === 'Solo') {
            Object.assign(baseRegistration, {
                player_name: playerName,
                game_uid: gameUid,
                player_email: playerEmail,
                player_phone: playerPhone,
                role
            });
        } else {
            Object.assign(baseRegistration, {
                team_name: teamName,
                captain_name: captainName,
                captain_email: captainEmail,
                captain_phone: captainPhone
            });
        }

        await models.Registration.create(baseRegistration);

        if (type !== 'Solo' && players && players.length > 0) {
            const captainUid = req.user.uid;
            let userTeam = await models.Team.findOne({ captain_uid: captainUid }).lean();
            if (!userTeam) {
                const memberRecord = await models.TeamMember.findOne({ user_uid: captainUid, confirmed: true }).lean();
                if (memberRecord) {
                    userTeam = await models.Team.findOne({ id: memberRecord.team_id }).lean();
                }
            }
            const teamMembers = userTeam ? await models.TeamMember.find({ team_id: userTeam.id }).lean() : [];

            let nextId = await nextNumberId(models.RegistrationPlayer);
            await models.RegistrationPlayer.insertMany(players.map((p) => {
                const matchedMember = teamMembers.find(tm => 
                    (tm.name && tm.name.toLowerCase() === p.name.toLowerCase()) || 
                    (tm.game_uid && tm.game_uid === p.gameUid)
                );

                return {
                    id: nextId++,
                    registration_id: regId,
                    user_uid: matchedMember ? matchedMember.user_uid : (p.userUid || p.user_uid),
                    name: p.name,
                    game_uid: p.gameUid,
                    role: p.role,
                    real_name: p.realName || p.name,
                    confirmed: !!p.confirmed
                };
            }));
        }

        res.status(201).json({
            success: true,
            registration: {
                id: regId,
                type,
                tournamentId,
                tournamentName: tourney.name,
                tournamentImage: tourney.image,
                status: 'Pending',
                stage: type === 'Solo' ? 2 : 1,
                submissionDate,
                teamName,
                captainName: captainName || playerName,
                playerName: playerName,
                gameUid: gameUid,
                role: role,
                players: players ? players.map(p => ({
                    name: p.name,
                    game_uid: p.gameUid,
                    role: p.role,
                    real_name: p.realName || p.name,
                    confirmed: !!p.confirmed
                })) : []
            }
        });
    } catch (err) {
        next(err);
    }
};

const getMyTeam = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        
        // Find if user is captain of a team
        let team = await models.Team.findOne({ captain_uid: uid }).lean();
        let isCaptain = true;
        
        if (!team) {
            // Find if user is a confirmed member of a team
            const member = await models.TeamMember.findOne({ user_uid: uid, confirmed: true }).lean();
            if (member) {
                team = await models.Team.findOne({ id: member.team_id }).lean();
                isCaptain = false;
            }
        }

        if (!team) {
            // Find pending invitations for this user
            const invites = await models.TeamMember.find({ user_uid: uid, confirmed: false }).lean();
            const invitations = [];
            for (const invite of invites) {
                const inviteTeam = await models.Team.findOne({ id: invite.team_id }).lean();
                if (inviteTeam) {
                    invitations.push({
                        teamId: inviteTeam.id,
                        teamName: inviteTeam.name,
                        logo: inviteTeam.logo,
                        description: inviteTeam.description,
                        captainName: inviteTeam.captain_name || inviteTeam.captain,
                        role: invite.role
                    });
                }
            }
            return res.json({ success: true, team: null, invitations });
        }

        const members = await models.TeamMember.find({ team_id: team.id }).select('name user_uid game_uid role real_name confirmed').lean();
        res.json({
            success: true,
            team: {
                id: team.id,
                name: team.name,
                logo: team.logo,
                captain: team.captain_name || team.captain,
                captain_uid: team.captain_uid,
                description: team.description,
                members: members.map(publicDoc)
            }
        });
    } catch (err) {
        next(err);
    }
};

const createMyTeam = async (req, res, next) => {
    try {
        const { name, description, members } = req.body;
        const user = req.user;

        if (!name || !description || !members || members.length === 0) {
            res.status(400);
            return next(new Error('Please provide team name, description and member list'));
        }

        // Check if captain is already in a team
        const existingCaptain = await models.Team.findOne({ captain_uid: user.uid }).lean();
        const existingMember = await models.TeamMember.findOne({ user_uid: user.uid, confirmed: true }).lean();
        if (existingCaptain || existingMember) {
            res.status(400);
            return next(new Error('You are already registered inside an active esports squad'));
        }

        // Check unique team name
        const teamNameExists = await models.Team.findOne({ name: new RegExp('^' + escapeRegExp(name) + '$', 'i') }).lean();
        if (teamNameExists) {
            res.status(400);
            return next(new Error('Team name already taken by another squad'));
        }

        // Validate captain detail (Member #1)
        const captainDetail = members[0];
        if (!captainDetail) {
            res.status(400);
            return next(new Error('Captain details are required'));
        }

        // Validate invited members
        const invitesToCreate = [];
        for (let i = 1; i < members.length; i++) {
            const m = members[i];
            if (!m.user_uid) continue; // Skip empty member inputs

            const cleanUid = m.user_uid.trim().toUpperCase();
            if (cleanUid === user.uid) {
                res.status(400);
                return next(new Error('You cannot invite yourself as a member.'));
            }

            const invitee = await models.User.findOne({ uid: cleanUid }).lean();
            if (!invitee) {
                res.status(400);
                return next(new Error(`Invalid Strikz Gamer UID: ${cleanUid}`));
            }

            // Check if invitee is already in a team
            const inviteeCaptain = await models.Team.findOne({ captain_uid: invitee.uid }).lean();
            const inviteeMember = await models.TeamMember.findOne({ user_uid: invitee.uid, confirmed: true }).lean();
            if (inviteeCaptain || inviteeMember) {
                res.status(400);
                return next(new Error(`Player ${invitee.username} (${cleanUid}) is already registered in an esports squad`));
            }

            invitesToCreate.push({
                user_uid: invitee.uid,
                name: invitee.username,
                realName: m.realName || invitee.username,
                gameUid: m.gameUid,
                role: m.role
            });
        }

        const teamId = 'team-' + Date.now();
        const logo = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a0a0f`;
        
        await models.Team.create({ 
            id: teamId, 
            name, 
            logo, 
            captain: user.username, 
            captain_name: user.username, 
            captain_uid: user.uid, 
            description 
        });

        let nextId = await nextNumberId(models.TeamMember);
        
        // Insert captain
        await models.TeamMember.create({
            id: nextId++,
            team_id: teamId,
            user_uid: user.uid,
            name: user.username,
            game_uid: captainDetail.gameUid,
            role: captainDetail.role,
            real_name: captainDetail.realName || user.username,
            confirmed: true
        });

        // Insert invited members
        if (invitesToCreate.length > 0) {
            await models.TeamMember.insertMany(invitesToCreate.map((m) => ({
                id: nextId++,
                team_id: teamId,
                user_uid: m.user_uid,
                name: m.name,
                game_uid: m.gameUid,
                role: m.role,
                real_name: m.realName,
                confirmed: false
            })));
        }

        res.status(201).json({
            success: true,
            team: { 
                id: teamId, 
                name, 
                logo, 
                captain: user.username, 
                captain_uid: user.uid, 
                description, 
                members: [
                    { name: user.username, user_uid: user.uid, gameUid: captainDetail.gameUid, role: captainDetail.role, realName: captainDetail.realName, confirmed: true },
                    ...invitesToCreate.map(inv => ({ name: inv.name, user_uid: inv.user_uid, gameUid: inv.gameUid, role: inv.role, realName: inv.realName, confirmed: false }))
                ]
            }
        });
    } catch (err) {
        next(err);
    }
};

const acceptInvite = async (req, res, next) => {
    try {
        const { teamId } = req.body;
        const uid = req.user.uid;

        if (!teamId) {
            res.status(400);
            return next(new Error('Please provide the team ID to accept'));
        }

        // Check if user is already in a team
        const existingCaptain = await models.Team.findOne({ captain_uid: uid }).lean();
        const existingMember = await models.TeamMember.findOne({ user_uid: uid, confirmed: true }).lean();
        if (existingCaptain || existingMember) {
            res.status(400);
            return next(new Error('You are already registered inside an active esports squad'));
        }

        const result = await models.TeamMember.updateOne(
            { team_id: teamId, user_uid: uid, confirmed: false },
            { $set: { confirmed: true } }
        );

        if (result.matchedCount === 0) {
            res.status(404);
            return next(new Error('No pending invitation found for this team'));
        }

        res.json({ success: true, message: 'Successfully accepted team invitation!' });
    } catch (err) {
        next(err);
    }
};

const declineInvite = async (req, res, next) => {
    try {
        const { teamId } = req.body;
        const uid = req.user.uid;

        if (!teamId) {
            res.status(400);
            return next(new Error('Please provide the team ID to decline'));
        }

        const result = await models.TeamMember.deleteOne({ team_id: teamId, user_uid: uid, confirmed: false });
        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('No pending invitation found to decline'));
        }

        res.json({ success: true, message: 'Successfully declined team invitation.' });
    } catch (err) {
        next(err);
    }
};

const confirmJoin = async (req, res, next) => {
    try {
        const { regId } = req.body;
        const uid = req.user.uid;

        if (!regId) {
            res.status(400);
            return next(new Error('Please provide the registration ID to confirm'));
        }

        const result = await models.RegistrationPlayer.updateOne(
            { registration_id: regId, user_uid: uid, confirmed: false },
            { $set: { confirmed: true } }
        );

        if (result.matchedCount === 0) {
            const alreadyConfirmed = await models.RegistrationPlayer.exists({ registration_id: regId, user_uid: uid, confirmed: true });
            if (alreadyConfirmed) {
                res.status(400);
                return next(new Error('You have already confirmed this registration invitation'));
            }
            res.status(404);
            return next(new Error('No pending registration invitation found for your Gamer UID'));
        }

        const allPlayers = await models.RegistrationPlayer.find({ registration_id: regId }).select('confirmed').lean();
        const allConfirmed = allPlayers.every((p) => p.confirmed === true);

        if (allConfirmed) {
            await models.Registration.updateOne({ id: regId }, { $set: { stage: 2 } });
        }

        res.json({ success: true, message: 'Roster join invitation confirmed successfully', allConfirmed });
    } catch (err) {
        next(err);
    }
};

const getPendingConfirmations = async (req, res, next) => {
    try {
        const uid = req.user.uid;
        if (!uid) return res.json({ success: true, confirmations: [] });

        const players = await models.RegistrationPlayer.find({
            user_uid: uid,
            confirmed: false
        }).lean();

        const confirmations = [];
        for (const player of players) {
            const reg = await models.Registration.findOne({ id: player.registration_id, status: 'Pending' }).lean();
            if (!reg) continue;
            const tourney = await models.Tournament.findOne({ id: reg.tournament_id }).select('name').lean();
            confirmations.push({
                regId: reg.id,
                tournamentId: reg.tournament_id,
                tournamentName: tourney ? tourney.name : '',
                teamName: reg.team_name
            });
        }

        res.json({ success: true, confirmations: confirmations.sort(sortByIdDesc) });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPublicSnapshot,
    trackRegistration,
    createRegistration,
    getMyTeam,
    createMyTeam,
    acceptInvite,
    declineInvite,
    confirmJoin,
    getPendingConfirmations
};
