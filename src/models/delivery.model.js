import mongoose, { Schema } from "mongoose";

const deliverySchema = new Schema({
    request: {
        type: Schema.Types.ObjectId,
        ref: "BloodRequest",
        required: true
    },
    driver: {
        type: Schema.Types.ObjectId,
        ref: "User", // Must be role: 'driver'
        required: true
    },
    // The "Live" GPS Data
    currentLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ["Pending Pickup", "In Transit", "Delivered", "Cancelled"],
        default: "Pending Pickup"
    },
    estimatedTime: { type: String }, // e.g. "15 mins"
    
    // The "Proof" (Nurse Signature)
    recipientName: { type: String },
    signatureUrl: { type: String }, // URL from Cloudinary
    
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date }
}, { timestamps: true });

export const Delivery = mongoose.model("Delivery", deliverySchema);