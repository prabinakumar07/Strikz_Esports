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
            models.Tournament.findOne({ id: reg.tournament_id }).select('name').lean()
        ]);

        res.json({
            success: true,
            registration: {
                id: reg.id,
                type: reg.type,
                tournamentId: reg.tournament_id,
                tournamentName: tourney ? tourney.name : '',
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
            let nextId = await nextNumberId(models.RegistrationPlayer);
            await models.RegistrationPlayer.insertMany(players.map((p) => ({
                id: nextId++,
                registration_id: regId,
                name: p.name,
                game_uid: p.gameUid,
                role: p.role,
                real_name: p.realName || p.name,
                confirmed: !!p.confirmed
            })));
        }

        res.status(201).json({
            success: true,
            registration: {
                id: regId,
                type,
                tournamentId,
                tournamentName: tourney.name,
                teamName,
                captainName: captainName || playerName,
                status: 'Pending',
                stage: type === 'Solo' ? 2 : 1,
                submissionDate
            }
        });
    } catch (err) {
        next(err);
    }
};

const getMyTeam = async (req, res, next) => {
    try {
        const username = req.user.username;
        const usernameRegex = new RegExp(`^${escapeRegExp(username)}$`, 'i');
        const member = await models.TeamMember.findOne({ name: usernameRegex }).lean();
        const team = await models.Team.findOne({
            $or: [
                { captain: usernameRegex },
                ...(member ? [{ id: member.team_id }] : [])
            ]
        }).lean();

        if (!team) return res.json({ success: true, team: null });

        const members = await models.TeamMember.find({ team_id: team.id }).select('name game_uid role real_name').lean();
        res.json({
            success: true,
            team: {
                id: team.id,
                name: team.name,
                logo: team.logo,
                captain: team.captain,
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
        const username = req.user.username;

        if (!name || !description || !members || members.length === 0) {
            res.status(400);
            return next(new Error('Please provide team name, description and member list'));
        }

        const usernameRegex = new RegExp(`^${escapeRegExp(username)}$`, 'i');
        const existingMember = await models.TeamMember.findOne({ name: usernameRegex }).lean();
        const existingCaptain = await models.Team.findOne({ captain: usernameRegex }).lean();
        if (existingMember || existingCaptain) {
            res.status(400);
            return next(new Error('You are already registered inside an active esports squad'));
        }

        const teamId = 'team-' + Date.now();
        const logo = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a0a0f`;
        await models.Team.create({ id: teamId, name, logo, captain: username, description });

        let nextId = await nextNumberId(models.TeamMember);
        await models.TeamMember.insertMany(members.map((m) => ({
            id: nextId++,
            team_id: teamId,
            name: m.name,
            game_uid: m.gameUid,
            role: m.role,
            real_name: m.realName || m.name
        })));

        res.status(201).json({
            success: true,
            team: { id: teamId, name, logo, captain: username, description, members }
        });
    } catch (err) {
        next(err);
    }
};

const confirmJoin = async (req, res, next) => {
    try {
        const { regId } = req.body;
        const username = req.user.username;

        if (!regId) {
            res.status(400);
            return next(new Error('Please provide the registration ID to confirm'));
        }

        const player = await models.RegistrationPlayer.findOne({
            registration_id: regId,
            name: new RegExp(`^${escapeRegExp(username)}$`, 'i')
        });

        if (!player) {
            res.status(404);
            return next(new Error('No pending registration invitation found for your gamertag'));
        }

        if (player.confirmed) {
            res.status(400);
            return next(new Error('You have already confirmed this registration invitation'));
        }

        player.confirmed = true;
        await player.save();

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
        const username = req.user.username;
        const players = await models.RegistrationPlayer.find({
            name: new RegExp(`^${escapeRegExp(username)}$`, 'i'),
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
    confirmJoin,
    getPendingConfirmations
};
