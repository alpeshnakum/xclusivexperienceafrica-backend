const express = require('express');
const messageRoutes = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// for user
messageRoutes.get('/get-messages', authMiddleware('user'), messageController().getMessages);
messageRoutes.post('/send-message', authMiddleware('user'), messageController().sendMessage);

// for employee
messageRoutes.get('/get-messages-from-user', authMiddleware('employee'), messageController().getMessagesFromUser);
messageRoutes.post('/send-message-to-user', authMiddleware('employee'), messageController().sendMessageToUser);
messageRoutes.post('/markAsRead/:userId', authMiddleware('user', 'employee'), messageController().markAsRead);


module.exports = messageRoutes;
