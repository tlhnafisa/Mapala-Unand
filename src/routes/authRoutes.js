const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;

