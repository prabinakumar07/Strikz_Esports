const express = require('express');
const router = express.Router();
const {
    createTicket,
    createPartnerInquiry
} = require('../controllers/ticketController');

// Public Enquiries
router.post('/chatbot-tickets', createTicket);
router.post('/partner-inquiries', createPartnerInquiry);

module.exports = router;
