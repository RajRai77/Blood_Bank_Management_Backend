import mongoose, { Schema } from "mongoose";

const inventorySchema = new Schema({
    unitId: {
        type: String, // The Barcode (e.g., #88291)
        required: true,
        unique: true,
        uppercase: true
    },
    bloodGroup: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1 // usually 1 unit per bag
    },
    status: {
        type: String,
        enum: ["available", "reserved", "expired", "quarantined"],
        default: "available"
    },
    expiryDate: { type: Date, required: true },
    location: { type: String }, // Fridge F-02
    
    // Relationships
    donor: { type: Schema.Types.ObjectId, ref: "Donor" }, // Who gave it?
    collectedBy: { type: Schema.Types.ObjectId, ref: "User" } // Which staff?

}, { timestamps: true });

export const Inventory = mongoose.model("Inventory", inventorySchema);