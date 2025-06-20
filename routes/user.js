const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/user');
const { authenticateJWT } = require('../middleware/auth');

// User registration
router.post('/register', register);

// User login
router.post('/login', login);

// Get user profile
router.get('/profile', authenticateJWT, getProfile);

module.exports = router;