const PackageModel = require("../models/packages.model");
const PurchasedPackageModel = require("../models/purchasedPackage.model");
const userModel = require("../models/user.model");
const path = require('path');
const fs = require("fs").promises;
const { sendContactUsEmail } = require("../utils/emailService");
const Message = require("../models/messeges.model");
const { default: mongoose } = require("mongoose");

const userController = () => {
    return {
        getPackages: async (req, res) => {
            const packages = await PackageModel.find();
            res.status(200).json({ message: "Packages Retrieved successfully.", packages });
        },

        contactUs: async (req, res) => {
            const { name, email, countryCode, phone, message } = req.body;
            try {
                sendContactUsEmail(name, email, countryCode, phone, message);
                res.status(200).json({ message: "Message sent." });
            } catch (error) {
                console.error("Contact Us Error:", error);
                res.status(500).json({ message: 'Server error' });
            }
        },

        getUserDetails: async (req, res) => {
            const userId = req.params.userId;
            try {
                const user = await userModel.findById(userId).select("-password -isVerified")
                if (!user) return res.status(404).json({ message: 'User not found' });
                res.status(200).json({ message: "User Retrieved successfully.", user });
            } catch (error) {
                console.error("Get User Error:", error);
                res.status(500).json({ message: 'Server error' });
            }
        },

        // getUserByEmail: async (req, res) => {
        //     const email = req.body.email;
        //     try {
        //         const user = await userModel.findOne({ email }).select("-password -isVerified")
        //         if (!user) return res.status(404).json({ message: 'User not found' });
        //         res.status(200).json({ message: "User Retrieved successfully.", user });
        //     } catch (error) {
        //         console.error("Get User Error:", error);
        //         res.status(500).json({ message: 'Server error' });
        //     }
        // },

        updateUserDetails: async (req, res) => {
            const userId = req.user._id;

            try {
                const currentUser = await userModel.findById(userId);

                if (!currentUser) {
                    return res.status(404).json({ message: "User not found." });
                }

                let updateData = { ...req.body };

                if (typeof updateData.address === "string") {
                    try {
                        updateData.address = JSON.parse(updateData.address);
                    } catch (error) {
                        return res.status(400).json({ message: "Invalid address format." });
                    }
                }

                let updatedDocuments = currentUser.documents ? [...currentUser.documents] : [];

                if (req.body.removedDocuments) {
                    try {
                        const removedDocs = Array.isArray(req.body.removedDocuments)
                            ? req.body.removedDocuments
                            : JSON.parse(req.body.removedDocuments);

                        for (const doc of removedDocs) {
                            const relativeDocPath = doc.startsWith('/') ? doc.slice(1) : doc;
                            const filePath = path.resolve(__dirname, '..', relativeDocPath);

                            try {
                                if (await fs.access(filePath).then(() => true).catch(() => false)) {
                                    await fs.unlink(filePath);
                                    updatedDocuments = updatedDocuments.filter((d) => d !== doc);
                                } else {
                                    console.warn(`File not found on disk: ${filePath}`);
                                }
                            } catch (err) {
                                console.error(`Error deleting file ${doc}:`, err);
                            }
                        }
                    } catch (error) {
                        console.error("Error parsing removedDocuments:", error);
                        return res.status(400).json({ message: "Invalid removedDocuments format." });
                    }
                }

                if (req.files && req.files.documents) {
                    const documents = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];
                    const newDocuments = documents.map((file) => {
                        const newFilePath = `/uploads/docs/${userId}/${path.basename(file.path)}`;
                        return newFilePath;
                    });
                    updatedDocuments = [...updatedDocuments, ...newDocuments];
                }

                updateData.documents = updatedDocuments;

                if (req.files && req.files.avatar) {
                    const avatar = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
                    updateData.userAvatar = `/uploads/avatars/${userId}/${path.basename(avatar.path)}`;
                }

                delete updateData.email;

                const user = await userModel.findByIdAndUpdate(
                    userId,
                    { $set: updateData },
                    { new: true, runValidators: true }
                ).select("-password -isVerified");

                res.status(200).json({ message: "User updated successfully.", user });
            } catch (error) {
                console.error("Update User Error:", error);
                res.status(500).json({ message: "Server error", error: error.message });
            }
        },

        getOrders: async (req, res) => {
            const userData = req.user;

            try {
                let orders = [];
                if (userData.role === 'admin') {
                    orders = await PurchasedPackageModel.find({ status: { $in: ['completed', 'refunded'] } }).populate('userId', 'firstName middleName lastName dob gender mailingAddress addressLine1 addressLine2 street city state country postalCode location countryCode phoneNumber passportNumber passportExpiryDate passportImage email userAvatar documents').sort({ createdAt: -1 });
                }
                else if (userData.role === 'employee') {
                    const employeeLocation = userData.mailingAddress;
                    if (!employeeLocation) {
                        return res.status(400).json({ message: 'Employee location not specified' });
                    }

                    const cities = await PackageModel.find({ city: employeeLocation });
                    const packageIds = cities.flatMap(city =>
                        city.packages.map(pkg => pkg._id)
                    );

                    orders = await PurchasedPackageModel.find({
                        packageId: { $in: packageIds }
                    }).populate('userId', 'firstName middleName lastName dob gender mailingAddress addressLine1 addressLine2 street city state country postalCode location countryCode phoneNumber passportNumber passportExpiryDate passportImage email userAvatar documents').sort({ createdAt: -1 });
                }
                else {
                    orders = await PurchasedPackageModel.find({ userId: userData._id }).populate('userId', 'firstName middleName lastName dob gender mailingAddress addressLine1 addressLine2 street city state country postalCode location countryCode phoneNumber passportNumber passportExpiryDate passportImage email userAvatar documents').sort({ createdAt: -1 });
                }

                const ordersWithPackageDetails = await Promise.all(orders.map(async (order) => {
                    const city = await PackageModel.findOne({ "packages._id": order.packageId }).select("-__v -packages.services");
                    if (!city) return order;
                    const packageDetails = city.packages.find(pkg => pkg._id.toString() === order.packageId.toString())

                    return {
                        ...order.toObject(),
                        city: city?.city || "Unknown City",
                        packageDetails,
                    };
                }));

                res.status(200).json({ message: "Orders Retrieved successfully.", orders: ordersWithPackageDetails });
            } catch (error) {
                console.error("Get Orders Error:", error);
                res.status(500).json({ message: 'Server error' });
            }
        },

        getMessages: async (req, res) => {
            const userId = req.user._id;
            try {
                const messages = await Message.find({ receiverIds: userId }).lean();
                res.status(200).json({ message: "Messages Retrieved successfully.", messages });
            } catch (error) {
                console.error("Get Messages Error:", error);
                res.status(500).json({ message: 'Server error' });
            }
        },

        getPackageDetails: async (req, res) => {
            const packageId = req.params.packageId;
            try {
                const cityPackage = await PackageModel.aggregate([
                    { $unwind: "$packages" },
                    { $match: { "packages._id": new mongoose.Types.ObjectId(packageId) } },
                    { $project: { _id: 0, city: 1, package: "$packages", } },
                ]);

                if (!cityPackage) {
                    return res.status(404).json({ message: "Package not found" });
                }

                res.status(200).json({
                    message: "Package Retrieved successfully.",
                    package: cityPackage[0].package,
                    city: cityPackage[0].city,
                });
            } catch (error) {
                console.error("Get Package Error:", error);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }
}

module.exports = userController;