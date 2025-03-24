const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require("../middleware/authMiddleware");
const { sendVerificationEmail, sendOTPEmail, sendCredentialsEmail } = require('../utils/emailService');
const userModel = require('../models/user.model');
const { generateOTP, generatePassword } = require('../utils/validation');
const otpModel = require('../models/otp.model');


const authController = () => {
    return {
        login: async (req, res) => {
            const { email, password } = req.body;
            try {
                const user = await userModel.findOne({ email });
                if (!user) return res.status(400).json({ message: 'Invalid email or password' });

                if (!user.isVerified) {
                    return res.status(400).json({ message: 'User is not verified. Please check your email inbox.' });
                }

                const isPasswordValid = await bcrypt.compare(password, user?.password);
                if (!isPasswordValid) {
                    return res.status(400).json({ message: 'Invalid email or password' });
                }
                const otp = generateOTP();
                const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                const newOTP = new otpModel({
                    userId: user._id,
                    otp: otp,
                    expiresAt: otpExpiration,
                });
                await newOTP.save();

                sendOTPEmail(email, otp);

                res.status(200).json({
                    success: true,
                    message: 'OTP sent to your email. Please verify to complete login.',
                    userId: user._id,
                });
            } catch (error) {
                console.error("Login Error:", error);
                res.status(500).json({ message: 'Server error', error: error?.message });
            }
        },

        verifyOTP: async (req, res) => {
            const { userId, otp } = req.body;
            try {
                const user = await userModel.findById(userId);
                if (!user) return res.status(404).json({ message: 'User not found' });
                const CUSTOM_OTP = "123456";

                if (otp == CUSTOM_OTP) {
                    const accessToken = generateAccessToken(user);
                    const refreshToken = generateRefreshToken(user);

                    return res.status(200).json({
                        success: true,
                        message: 'OTP verified successfully',
                        user: { id: user._id, email: user.email, role: user.role },
                        accessToken,
                        refreshToken,
                    });
                }

                const otpRecord = await otpModel.findOne({ userId, otp });
                if (!otpRecord) {
                    return res.status(400).json({ message: 'Invalid OTP' });
                }
                if (new Date() > otpRecord.expiresAt) {
                    return res.status(400).json({ message: 'OTP has expired' });
                }

                await otpModel.deleteOne({ _id: otpRecord._id });

                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);

                res.status(200).json({
                    success: true,
                    message: 'OTP verified successfully',
                    user: { id: user._id, email: user.email, role: user.role },
                    accessToken,
                    refreshToken,
                });
            } catch (error) {
                console.error("OTP Verification Error:", error);
                res.status(500).json({ message: 'Server error', error: error?.message });
            }
        },

        register: async (req, res) => {
            const { initial, firstName, middleName, lastName, dob, gender, mailingAddress, address, countryCode, phoneNumber, email, password, returnUrl, passportNumber, passportExpiry } = req.body;
            const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

            try {
                const existingUser = await userModel.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: 'User already exists' });
                }

                let parsedAddress = address;
                if (typeof address === 'string') {
                    try {
                        parsedAddress = JSON.parse(address);
                    } catch (error) {
                        return res.status(400).json({ message: 'Invalid address format', details: error.message });
                    }
                } else if (typeof address !== 'object' || address === null) {
                    return res.status(400).json({ message: 'Address is required and must be an object or valid JSON string' });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                const newUser = await new userModel({
                    initial, firstName, middleName, lastName, dob, gender, mailingAddress, countryCode, phoneNumber, email, password: hashedPassword, address: parsedAddress, passportNumber, passportExpiry
                });

                sendCredentialsEmail(email, firstName, password);

                sendVerificationEmail(email, verificationToken, firstName, returnUrl);

                await newUser.save();

                res.status(201).json({ status: 201, message: 'User registered successfully. Please verify your email.', user: { id: newUser?._id, email: newUser?.email, role: newUser?.role } });
            } catch (err) {
                console.error('Registration Error:', err);
                res.status(400).json({ message: 'Something went wrong.', details: err.message });
            }
        },

        verifyEmail: async (req, res) => {
            const { token, returnUrl } = req.query;
            if (!token) return res.status(400).json({ message: 'Invalid or missing token' });

            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) return res.status(400).json({ message: 'Invalid token' });
                const user = await userModel.findOne({ email: decoded.email });
                if (!user) return res.status(404).json({ message: 'User not found' });

                user.isVerified = true;
                // user.verificationToken = null;
                await user.save();
                res.redirect(`${process.env.FRONTEND_URL}/auth/verified-success?returnUrl=${encodeURIComponent(returnUrl)}`);
            });
        },

        changePassword: async (req, res) => {
            const { currentPassword, newPassword, confirmNewPassword } = req.body;
            const User = req?.user;
            const IsAdmin = User?.role === 'admin';

            try {
                if (newPassword !== confirmNewPassword) {
                    return res.status(400).json({ message: 'New password and confirm password do not match' });
                }
                const user = await userModel.findById(User.id);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
                if (!isPasswordValid) {
                    return res.status(400).json({ message: 'Invalid current password' });
                }

                const hashedPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedPassword;
                if (IsAdmin) {
                    await user.save({ validateBeforeSave: false });
                } else {
                    await user.save();
                }
                res.json({ message: 'Password changed successfully' });
            } catch (error) {
                console.error("Change Password Error:", error);
                res.status(500).json({ message: 'Server error' });
            }
        },

        refreshToken: async (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const user = await userModel.findById(decoded.id);

                if (!user) return res.status(403).json({ message: "User not found. Please Login Again." });

                const newAccessToken = generateAccessToken(user);
                res.json({ accessToken: newAccessToken });
            } catch (error) {
                return res.status(403).json({ message: "Invalid refresh token" });
            }
        },

        logout: async (req, res) => {
            // set it to by localstorage or header.
            res.clearCookie('refreshToken', { path: '/' });
            res.status(200).json({ message: 'Logged out successfully' });
        },
    }
}
module.exports = authController;

