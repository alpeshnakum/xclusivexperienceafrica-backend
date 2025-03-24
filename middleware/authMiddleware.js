const expressAsyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const authMiddleware = (...roles) => {
    return expressAsyncHandler(async (req, res, next) => {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "No token, authorization denied. Please Login." });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findOne({ email: decoded.email }).select("-password");
            if (!user) {
                return res.status(401).json({ error: "User not found" });
            }

            req.user = user;
            if (roles.length && !roles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden: Insufficient rights" });
            }
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired", expired: true });
            }
            return res.status(401).json({ message: "Invalid token" });
        }
    });
};

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

module.exports = {
    authMiddleware,
    generateAccessToken,
    generateRefreshToken,
}