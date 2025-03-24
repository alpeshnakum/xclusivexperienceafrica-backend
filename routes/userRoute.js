const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { updateUserPassportImage } = require('../middleware/uploadImage/updateUser');
const userRoutes = express.Router();

// user routes
userRoutes.get('/info/:userId', userController().getUserDetails)
// userRoutes.get('/getUserByEmail', userController().getUserByEmail)
userRoutes.get('/packages', userController().getPackages)
userRoutes.put('/update-profile', authMiddleware('user'), updateUserPassportImage, userController().updateUserDetails)

userRoutes.get('/get-package-details/:packageId', userController().getPackageDetails)

// order routes
userRoutes.get('/orders', authMiddleware('user', 'admin', 'employee'), userController().getOrders)
userRoutes.get('/messages', authMiddleware('user'), userController().getMessages)

userRoutes.post('/contact-us', userController().contactUs)

module.exports = userRoutes;
