const { models, nextNumberId } = require('../config/db');

// helper to escape regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 1. Send Friend Request
const sendFriendRequest = async (req, res, next) => {
    try {
        const { friendUid } = req.body;
        const myUid = req.user.uid;

        if (!friendUid) {
            res.status(400);
            return next(new Error('Friend Gamer UID is required'));
        }

        const cleanFriendUid = friendUid.trim().toLowerCase();
        if (cleanFriendUid === myUid.toLowerCase()) {
            res.status(400);
            return next(new Error('You cannot send a friend request to yourself'));
        }

        const targetUser = await models.User.findOne({ uid: cleanFriendUid }).lean();
        if (!targetUser) {
            res.status(404);
            return next(new Error('Gamer not found in the arena'));
        }

        // Check if relationship already exists
        const existing = await models.Friendship.findOne({
            $or: [
                { user_uid_1: myUid, user_uid_2: targetUser.uid },
                { user_uid_1: targetUser.uid, user_uid_2: myUid }
            ]
        }).lean();

        if (existing) {
            if (existing.status === 'Pending') {
                res.status(400);
                return next(new Error('Friend request already pending or received'));
            } else {
                res.status(400);
                return next(new Error('You are already friends with this gamer'));
            }
        }

        const id = 'friendship-' + Date.now();
        await models.Friendship.create({
            id,
            user_uid_1: myUid,
            user_uid_2: targetUser.uid,
            status: 'Pending',
            sender_uid: myUid
        });

        res.status(201).json({
            success: true,
            message: `Friend request dispatched to ${targetUser.username}`
        });
    } catch (err) {
        next(err);
    }
};

// 2. Get Pending Friend Requests
const getFriendRequests = async (req, res, next) => {
    try {
        const myUid = req.user.uid;

        const pendingList = await models.Friendship.find({
            $or: [
                { user_uid_1: myUid },
                { user_uid_2: myUid }
            ],
            status: 'Pending',
            sender_uid: { $ne: myUid }
        }).lean();

        const requests = [];
        for (const item of pendingList) {
            const senderUid = item.sender_uid;
            const sender = await models.User.findOne({ uid: senderUid }).select('username uid avatar').lean();
            if (sender) {
                requests.push({
                    friendshipId: item.id,
                    username: sender.username,
                    uid: sender.uid,
                    avatar: sender.avatar
                });
            }
        }

        res.json({ success: true, requests });
    } catch (err) {
        next(err);
    }
};

// 3. Accept Friend Request
const acceptFriendRequest = async (req, res, next) => {
    try {
        const { friendshipId } = req.body;
        const myUid = req.user.uid;

        if (!friendshipId) {
            res.status(400);
            return next(new Error('Friendship ID is required'));
        }

        const friendship = await models.Friendship.findOne({ id: friendshipId });
        if (!friendship) {
            res.status(404);
            return next(new Error('Friend request not found'));
        }

        if (friendship.user_uid_1 !== myUid && friendship.user_uid_2 !== myUid) {
            res.status(403);
            return next(new Error('Access denied: You are not a party to this request'));
        }

        friendship.status = 'Accepted';
        await friendship.save();

        res.json({ success: true, message: 'Friend request accepted! You can now chat.' });
    } catch (err) {
        next(err);
    }
};

// 4. Decline/Reject Friend Request
const rejectFriendRequest = async (req, res, next) => {
    try {
        const { friendshipId } = req.body;
        const myUid = req.user.uid;

        if (!friendshipId) {
            res.status(400);
            return next(new Error('Friendship ID is required'));
        }

        const result = await models.Friendship.deleteOne({
            id: friendshipId,
            $or: [
                { user_uid_1: myUid },
                { user_uid_2: myUid }
            ]
        });

        if (result.deletedCount === 0) {
            res.status(404);
            return next(new Error('Friend request not found or unauthorized'));
        }

        res.json({ success: true, message: 'Friend request declined' });
    } catch (err) {
        next(err);
    }
};

// 5. Get Friend List
const getFriends = async (req, res, next) => {
    try {
        const myUid = req.user.uid;

        const list = await models.Friendship.find({
            $or: [
                { user_uid_1: myUid },
                { user_uid_2: myUid }
            ],
            status: 'Accepted'
        }).lean();

        const friends = [];
        for (const item of list) {
            const friendUid = item.user_uid_1 === myUid ? item.user_uid_2 : item.user_uid_1;
            const friend = await models.User.findOne({ uid: friendUid }).select('username uid avatar').lean();
            if (friend) {
                friends.push(friend);
            }
        }

        res.json({ success: true, friends });
    } catch (err) {
        next(err);
    }
};

// 6. Send Direct Message
const sendChatMessage = async (req, res, next) => {
    try {
        const { receiverUid, message } = req.body;
        const myUid = req.user.uid;

        if (!receiverUid || !message || !message.trim()) {
            res.status(400);
            return next(new Error('Receiver and non-empty message body are required'));
        }

        // Verify they are friends
        const isFriend = await models.Friendship.exists({
            $or: [
                { user_uid_1: myUid, user_uid_2: receiverUid },
                { user_uid_1: receiverUid, user_uid_2: myUid }
            ],
            status: 'Accepted'
        });

        if (!isFriend) {
            res.status(403);
            return next(new Error('Access Denied: You can only chat with established friends'));
        }

        const id = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const msg = await models.ChatMessage.create({
            id,
            sender_uid: myUid,
            receiver_uid: receiverUid,
            message: message.trim(),
            created_at: new Date().toISOString()
        });

        res.status(201).json({ success: true, message: msg });
    } catch (err) {
        next(err);
    }
};

// 7. Get Direct Message History
const getChatMessageHistory = async (req, res, next) => {
    try {
        const myUid = req.user.uid;
        const { friendUid } = req.params;

        if (!friendUid) {
            res.status(400);
            return next(new Error('Friend Gamer UID is required'));
        }

        const history = await models.ChatMessage.find({
            $or: [
                { sender_uid: myUid, receiver_uid: friendUid },
                { sender_uid: friendUid, receiver_uid: myUid }
            ]
        })
        .sort({ created_at: 1 })
        .limit(100)
        .lean();

        res.json({ success: true, history });
    } catch (err) {
        next(err);
    }
};

// 8. Send Team Chat Message
const sendTeamMessage = async (req, res, next) => {
    try {
        const { message } = req.body;
        const user = req.user;

        if (!message || !message.trim()) {
            res.status(400);
            return next(new Error('Non-empty message body is required'));
        }

        // Find user's team
        let team = await models.Team.findOne({ captain_uid: user.uid }).lean();
        if (!team) {
            const memberRecord = await models.TeamMember.findOne({ user_uid: user.uid, confirmed: true }).lean();
            if (memberRecord) {
                team = await models.Team.findOne({ id: memberRecord.team_id }).lean();
            }
        }

        if (!team) {
            res.status(403);
            return next(new Error('Access Denied: You must belong to an active esports squad to use team chat'));
        }

        const id = 'teamsg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const msg = await models.TeamMessage.create({
            id,
            team_id: team.id,
            sender_uid: user.uid,
            sender_name: user.username,
            sender_avatar: user.avatar,
            message: message.trim(),
            created_at: new Date().toISOString()
        });

        res.status(201).json({ success: true, message: msg });
    } catch (err) {
        next(err);
    }
};

// 9. Get Team Chat History
const getTeamMessageHistory = async (req, res, next) => {
    try {
        const user = req.user;

        // Find user's team
        let team = await models.Team.findOne({ captain_uid: user.uid }).lean();
        if (!team) {
            const memberRecord = await models.TeamMember.findOne({ user_uid: user.uid, confirmed: true }).lean();
            if (memberRecord) {
                team = await models.Team.findOne({ id: memberRecord.team_id }).lean();
            }
        }

        if (!team) {
            res.status(403);
            return next(new Error('Access Denied: You must belong to an active esports squad to use team chat'));
        }

        const history = await models.TeamMessage.find({ team_id: team.id })
            .sort({ created_at: 1 })
            .limit(100)
            .lean();

        res.json({ success: true, history });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    sendChatMessage,
    getChatMessageHistory,
    sendTeamMessage,
    getTeamMessageHistory
};
