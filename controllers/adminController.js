const PurchasedPackageModel = require("../models/purchasedPackage.model");
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

const adminController = () => {
    return {

        getAllEmployees: async (req, res) => {
            try {
                const employees = await userModel.find({ role: "employee" }).sort({ createdAt: -1 }).select("-password");
                res.status(200).json(employees);
            } catch (error) {
                res.status(500).json({ message: "Error fetching employees", error: error.message });
            }
        },

        createEmployee: async (req, res) => {
            try {
                const existingEmployee = await userModel.findOne({ email: req.body.email });
                if (existingEmployee) {
                    return res.status(400).json({ message: "Employee already exists" });
                }

                const hashedPassword = await bcrypt.hash(req.body.password, 10);

                const newEmployee = new userModel({ ...req.body, password: hashedPassword, role: "employee", isVerified: true });
                await newEmployee.save();
                res.status(201).json({ message: "Employee added successfully", employee: newEmployee });
            } catch (error) {
                res.status(500).json({ message: "Error adding employee", error: error.message });
            }
        },

        updateEmployee: async (req, res) => {
            try {
                if (req.body?.password) {
                    const hashedPassword = await bcrypt.hash(req.body?.password, 10);
                    req.body.password = hashedPassword;
                }

                const updatedEmployee = await userModel.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true }).select("-password");
                res.status(200).json({ message: "Employee updated successfully", employee: updatedEmployee });
            } catch (error) {
                res.status(500).json({ message: "Error updating employee", error: error.message });
            }
        },

        deleteEmployee: async (req, res) => {
            try {
                await userModel.findByIdAndDelete(req.params.id);
                res.status(200).json({ message: "Employee deleted successfully" });
            } catch (error) {
                res.status(500).json({ message: "Error deleting employee", error: error.message });
            }
        },

        updateBookingDates: async (req, res) => {
            const { bookingId } = req.params;
            const { checkInDate, checkOutDate } = req.body;

            try {
                if (!checkInDate || !checkOutDate) {
                    return res.status(400).json({ message: "Check-in and check-out dates are required." });
                }

                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0);

                const checkIn = new Date(checkInDate);
                if (isNaN(checkIn.getTime())) {
                    return res.status(400).json({ message: "Invalid check-in date format." });
                }
                checkIn.setHours(0, 0, 0, 0);

                const checkOut = new Date(checkOutDate);
                if (isNaN(checkOut.getTime())) {
                    return res.status(400).json({ message: "Invalid check-out date format." });
                }
                checkOut.setHours(0, 0, 0, 0);

                if (checkIn < currentDate) {
                    return res.status(400).json({ message: "Check-in date must be in the future." });
                }

                if (checkOut <= checkIn) {
                    return res.status(400).json({ message: "Check-out date must be after check-in date." });
                }

                const updatedBooking = await PurchasedPackageModel.findByIdAndUpdate(
                    bookingId,
                    { checkInDate, checkOutDate },
                    { new: true, runValidators: true }
                ).populate('userId', '-password');

                if (!updatedBooking) {
                    return res.status(404).json({ message: "Booking not found." });
                }

                res.status(200).json({ message: "Booking dates updated successfully.", booking: updatedBooking });
            } catch (error) {
                console.error("Error updating booking dates:", error);
                res.status(500).json({ message: "Server error", error: error.message });
            }
        },
    }
}

module.exports = adminController;