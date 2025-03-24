const mongoose = require('mongoose');

const PurchasedAddOnSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
});

const PurchasedPackageSchema = new mongoose.Schema({
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purchasedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    amount: { type: Number, required: true },
    netAmount: { type: Number },
    stripeFee: Number,
    currency: { type: String, default: "USD" },
    paymentIntentId: { type: String, required: false },
    checkInDate: { type: Date, required: false },
    checkOutDate: { type: Date, required: false },
    guestDetails: { type: String, required: false },
    addOns: [PurchasedAddOnSchema],
    registrationStatus: { type: String, enum: ["authenticated", "existing", "new", "new-fallback", "pending"], default: "pending" },
    refundedAmount: { type: Number, default: 0 },

}, { timestamps: true });

const PurchasedPackageModel = mongoose.models.PurchasedPackage || mongoose.model('PurchasedPackage', PurchasedPackageSchema);

module.exports = PurchasedPackageModel;