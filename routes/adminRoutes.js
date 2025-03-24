const express = require('express');
const adminRoutes = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');

adminRoutes.get('/getAllEmployees', authMiddleware('admin'), adminController().getAllEmployees);
adminRoutes.post('/createEmployee', authMiddleware('admin'), adminController().createEmployee);
adminRoutes.put('/updateEmployee/:id', authMiddleware('admin'), adminController().updateEmployee);
adminRoutes.delete('/deleteEmployee/:id', authMiddleware('admin'), adminController().deleteEmployee);


adminRoutes.put('/updateBookingDates/:bookingId', authMiddleware('admin'), adminController().updateBookingDates);

module.exports = adminRoutes;
