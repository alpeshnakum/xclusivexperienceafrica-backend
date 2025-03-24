const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const purchaseController = require('../controllers/purchaseController');
const purchaseRoute = express.Router();


purchaseRoute.post('/create-checkout-session', purchaseController().createPurchase);
purchaseRoute.get('/get-stripe-session/:sessionId', purchaseController().getSessionData);


purchaseRoute.post('/refund-booking/:bookingId', authMiddleware('admin'), purchaseController().refundPayment);

module.exports = purchaseRoute;
