const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoute');
const userRoutes = require('./userRoute');
const purchaseRoute = require('./purchaseRoute');
const messageRoutes = require('./messageRoutes');
const adminRoutes = require('./adminRoutes');

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/payment", purchaseRoute)
router.use("/messages", messageRoutes);
router.use("/admin", adminRoutes);

module.exports = router

