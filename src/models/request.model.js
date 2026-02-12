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

    // --- NEW: PAYMENT DETAILS ---
    payment: {
        amount: { type: Number, required: true }, // The Final Price
        method: { type: String, enum: ["Online", "COD", "Pending"], default: "Pending" },
        status: { type: String, enum: ["Pending", "Paid", "Verified"], default: "Pending" },
        upiId: { type: String }, // The Acceptor's UPI ID
        transactionId: { type: String }, // The User's Reference ID
        paymentNote: { type: String }
    },
    
    deliveryDetails: {
        // ... existing fields ...
        driverName: String,
        contactNumber: String,
        vehicleNumber: String,
        startedAt: Date,
        estimatedArrival: Date,
        notes: String,
        trackingStarted: { type: Boolean, default: false },
        
        // --- NEW FIELDS ---
        deliveryOTP: String, // The Secret Code
        completedAt: Date    // When it was delivered
    }

}, { timestamps: true });

export const Request = mongoose.model("Request", requestSchema);