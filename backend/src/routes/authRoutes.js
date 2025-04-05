const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Registrace nového uživatele
router.post('/register', authController.register);

// Přihlášení uživatele
router.post('/login', authController.login);

// Získání informací o přihlášeném uživateli (chráněno autentizací)
router.get('/me', authMiddleware, authController.getProfile);

// Odhlášení uživatele
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
