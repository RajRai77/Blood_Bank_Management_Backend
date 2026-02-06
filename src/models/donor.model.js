import mongoose, { Schema } from "mongoose";

const donorSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { 
        type: String, 
        enum: ["Male", "Female", "Other"],
        required: true 
    },
    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: true,
        index: true // Searching by blood group is frequent
    },
    address: { type: String },
    lastDonationDate: { type: Date },
    isFitToDonate: { type: Boolean, default: true },
    
    // Medical Flags (for your "Exclusion Check" checkboxes)
    medicalHistory: {
        hasTattoo: { type: Boolean, default: false }, // <6 months
        majorSurgery: { type: Boolean, default: false } // <12 months
    }
}, { timestamps: true });

export const Donor = mongoose.model("Donor", donorSchema);