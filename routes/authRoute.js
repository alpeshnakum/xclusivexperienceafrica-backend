const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const authRoutes = express.Router();

authRoutes.post('/login', authController().login)
authRoutes.post('/verify-otp', authController().verifyOTP);
authRoutes.post('/register', authController().register)
authRoutes.post('/change-password', authMiddleware('user', 'admin', 'employee'), authController().changePassword)

authRoutes.get('/verify-email', authController().verifyEmail)
authRoutes.post('/refresh-token', authController().refreshToken)


module.exports = authRoutes;

