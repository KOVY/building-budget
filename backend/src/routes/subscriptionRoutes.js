const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/authMiddleware');

// Všechny routy jsou chráněny autentizací
router.use(authMiddleware);

// Získání informací o předplatném uživatele
router.get('/status', subscriptionController.getSubscriptionStatus);

// Aktivace zkušební verze
router.post('/activate-trial', subscriptionController.activateTrial);

// Aktivace placeného předplatného
router.post('/activate', subscriptionController.activateSubscription);

// Zrušení předplatného
router.post('/cancel', subscriptionController.cancelSubscription);

// Získání historie plateb
router.get('/payment-history', subscriptionController.getPaymentHistory);

module.exports = router;
