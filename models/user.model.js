const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: false },
    street: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
});

const UserSchema = new mongoose.Schema({
    initial: String,
    firstName: { type: String, required: true },
    middleName: { type: String, required: false },
    lastName: { type: String, required: false },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    mailingAddress: { type: String, required: false },
    address: AddressSchema,
    location: { type: String, required: false },
    countryCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    passportNumber: { type: String, required: false },
    passportExpiryDate: { type: Date, required: false },
    passportImage: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'employee'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    userAvatar: { type: String, required: false },
    verificationToken: String,
    documents: { type: [String], default: [] },

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);