const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    sendChatMessage,
    getChatMessageHistory,
    sendTeamMessage,
    getTeamMessageHistory
} = require('../controllers/socialController');

// All social/chat routes require authentication
router.use(protect);

// Friends System
router.post('/friends/request', sendFriendRequest);
router.get('/friends/requests', getFriendRequests);
router.post('/friends/accept', acceptFriendRequest);
router.post('/friends/reject', rejectFriendRequest);
router.get('/friends', getFriends);

// Direct Messages (Chat)
router.post('/chats/send', sendChatMessage);
router.get('/chats/history/:friendUid', getChatMessageHistory);

// Team Chat
router.post('/my-team/chat', sendTeamMessage);
router.get('/my-team/chat', getTeamMessageHistory);

module.exports = router;
