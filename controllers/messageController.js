const Message = require("../models/messeges.model");
const userModel = require("../models/user.model");
const { sendChatNotificationEmail } = require("../utils/emailService");

const messageController = () => {
    return {
        // for user
        sendMessage: async (req, res) => {
            const senderId = req.user._id;
            const { receiverId, content } = req.body;
            if (!receiverId || !content) {
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }
            try {
                const user = await userModel.findById(senderId);
                const employeeLocation = req.user.location;
                const employee = await userModel.findOne({ location: { $regex: employeeLocation, $options: 'i' }, role: "employee" });
                if (!employee) {
                    return res.status(400).json({ success: false, message: "Employee not found" });
                }

                sendChatNotificationEmail(employee?.email, user?.firstName, user?.email, content);

                const message = new Message({ senderId, receiverId: employee._id, content });
                await message.save();
                res.status(200).json({ message: 'Message sent successfully', message });
            } catch (error) {
                res.status(500).json({ message: 'Server error', error: error?.message });
            }
        },

        getMessages: async (req, res) => {
            const userId = req.user._id;
            try {
                const messages = await Message.find({
                    $or: [{ senderId: userId }, { receiverId: userId }],
                }).sort({ createdAt: -1 })
                    .populate('senderId', 'firstName lastName')
                    .populate('receiverId', 'firstName lastName')
                    .lean();

                res.status(200).json({ message: 'Messages retrieved successfully', messages });
            } catch (error) {
                res.status(500).json({ message: 'Server error', error: error?.message });
            }
        },

        // for employee
        getMessagesFromUser: async (req, res) => {
            const employeeId = req.user._id;
            try {
                const users = await Message.aggregate([
                    {
                        $match: {
                            $or: [
                                { senderId: employeeId },
                                { receiverId: employeeId },
                            ],
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $cond: {
                                    if: { $eq: ["$senderId", employeeId] },
                                    then: "$receiverId",
                                    else: "$senderId",
                                },
                            },
                            lastInteraction: { $max: "$createdAt" },
                            isRead: { $min: "$isRead" },
                            userData: { $first: "$$ROOT" },
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "_id",
                            foreignField: "_id",
                            as: "userDetails",
                        },
                    },
                    {
                        $unwind: "$userDetails",
                    },
                    {
                        $project: {
                            _id: "$userDetails._id",
                            firstName: "$userDetails.firstName",
                            lastName: "$userDetails.lastName",
                            location: "$userDetails.location",
                            userAvatar: "$userDetails.userAvatar",
                            email: "$userDetails.email",
                            isRead: 1,
                            createdAt: "$lastInteraction",
                            content: "$userData.content",
                        },
                    },
                    {
                        $sort: { createdAt: -1 },
                    },
                ]);

                const usersWithMessages = await Promise.all(
                    users.map(async (user) => {
                        const messages = await Message.find({
                            $or: [
                                { senderId: user._id, receiverId: employeeId },
                                { senderId: employeeId, receiverId: user._id },
                            ],
                        })
                            .sort({ createdAt: 1 })
                            .populate("senderId", "firstName lastName userAvatar email")
                            .populate("receiverId", "firstName lastName userAvatar email");

                        return {
                            ...user,
                            messages,
                        };
                    })
                );

                res.status(200).json({
                    message: "Users with interactions retrieved successfully",
                    users: usersWithMessages,
                });
            } catch (error) {
                res.status(500).json({ message: "Server error", error: error?.message });
            }
        },

        sendMessageToUser: async (req, res) => {
            const senderId = req.user._id;
            const { receiverId, content } = req.body;
            if (!receiverId || !content) {
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }
            try {
                const message = new Message({ senderId, receiverId, content });
                await message.save();

                const user = await userModel.findById(message?.receiverId);
                const employee = await userModel.findById(message?.senderId);
                sendChatNotificationEmail(user?.email, employee?.firstName, employee?.email, content);

                res.status(200).json({ message: 'Message sent successfully', message });
            } catch (error) {
                res.status(500).json({ message: 'Server error', error: error?.message });
            }
        },

        markAsRead: async (req, res) => {
            const employeeId = req.user._id;
            const userId = req.params.userId;
            try {
                const result = await Message.updateMany(
                    { senderId: userId, receiverId: employeeId, isRead: false },
                    { isRead: true }
                );
                if (result.modifiedCount > 0) {
                    const updatedMessages = await Message.find({
                        senderId: userId,
                        receiverId: employeeId,
                    })
                        .populate('senderId', 'firstName lastName')
                        .populate('receiverId', 'firstName lastName');
                    res.status(200).json({ message: 'Messages marked as read', updatedMessages });
                } else {
                    res.status(200).json({ message: 'No unread messages to mark as read' });
                }
            } catch (error) {
                res.status(500).json({ message: 'Server error', error: error?.message });
            }
        }
    }
}

module.exports = messageController;