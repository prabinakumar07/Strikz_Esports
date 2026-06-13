const express = require('express');
const router = express.Router();
const {
    getPublicSnapshot,
    trackRegistration,
    createRegistration,
    getMyTeam,
    createMyTeam,
    acceptInvite,
    declineInvite,
    confirmJoin,
    getPendingConfirmations
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/snapshot', getPublicSnapshot);
router.get('/registrations/track/:id', trackRegistration);

// Private User actions
router.post('/registrations', protect, createRegistration);
router.get('/my-team', protect, getMyTeam);
router.get('/my-team/confirmations', protect, getPendingConfirmations);
router.post('/my-team', protect, createMyTeam);
router.post('/my-team/accept-invite', protect, acceptInvite);
router.post('/my-team/decline-invite', protect, declineInvite);
router.post('/my-team/confirm-join', protect, confirmJoin);

module.exports = router;
