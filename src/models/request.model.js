import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
    hospital: {
        type: Schema.Types.ObjectId,
        ref: "User", // The hospital user who logged in
        required: true
    },
    patientName: { type: String }, // Optional, for internal hospital tracking
    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: true
    },
    unitsRequired: {
        type: Number,
        required: true,
        min: 1
    },
    urgency: {
        type: String,
        enum: ["Critical", "Urgent", "Normal"],
        default: "Normal"
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Fulfilled", "Rejected"],
        default: "Pending"
    },
    reason: { type: String } // "Heart Surgery", etc.
}, { timestamps: true });

export const BloodRequest = mongoose.model("BloodRequest", requestSchema);