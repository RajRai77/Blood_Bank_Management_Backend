import mongoose, { Schema } from "mongoose";

const donorSchema = new Schema({
    donorId: {
        type: String,
        required: true,
        unique: true, // This is now our primary key
        uppercase: true,
        trim: true,
        index: true
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { 
        type: String, 
        trim: true, 
        sparse: true // Allows multiple 'null' values (perfect for optional emails)
    },
    phone: { type: String, required: true }, // No longer unique!
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
    medicalHistory: {
        hasTattoo: { type: Boolean, default: false },
        majorSurgery: { type: Boolean, default: false }
    }
}, { timestamps: true });

export const Donor = mongoose.model("Donor", donorSchema);