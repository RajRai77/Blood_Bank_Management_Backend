import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
    // Recipient (Who is asked for blood)
    organization: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    // Sender (Who asked for blood) - NEW FIELD
    requesterId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    requesterName: { type: String, required: true }, // Display name
    requesterType: { type: String, enum: ["Hospital", "Individual", "Clinic"], required: true },
    
    // Patient Details
    patientName: { type: String, required: true },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true },
    requestType: { type: String, enum: ["Whole Blood", "Plasma", "Packed Red Cells", "Platelets"], required: true },
    quantity: { type: Number, required: true, min: 1 },

    // Status
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "completed"],
        default: "pending"
    },
    priority: { type: String, enum: ["Urgent", "Normal"], default: "Normal" },
    
    // Delivery Info - NEW FIELDS
    deliveryDetails: {
        driverName: String,
        contactNumber: String,
        vehicleNumber: String,
        estimatedTime: String,
        startedAt: Date
    }

}, { timestamps: true });

export const Request = mongoose.model("Request", requestSchema);