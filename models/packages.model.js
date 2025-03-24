const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PackageSchema = new Schema({
    name: { type: String, required: true },
    images: { type: [String], required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
    minDurationInDays: { type: Number, required: true },
    maxDurationInDays: { type: Number, required: true },
    services: { type: [String], required: true },
});

const CitySchema = new Schema({
    city: { type: String, required: true, unique: true },
    hotels: { type: [String] },
    packages: [PackageSchema],
});

const PackageModel = mongoose.models.Package || mongoose.model("Package", CitySchema);

module.exports = PackageModel;
