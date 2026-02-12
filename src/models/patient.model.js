import mongoose, { Schema } from "mongoose";

const patientSchema = new Schema({
    hospitalId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    bloodGroup: { type: String, required: true },
    contact: { type: String, required: true },
    admissionDate: { type: Date, default: Date.now },
    diagnosis: { type: String }, // e.g., "Dengue", "Surgery"
    status: { type: String, enum: ["Admitted", "Discharged"], default: "Admitted" },
    
    // Track Blood Given to this patient
    bloodHistory: [{
        bloodGroup: String,
        component: String,
        quantity: Number,
        usageType: { type: String, enum: ["Sold", "Donated"] }, // The Pivot
        price: Number,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export const Patient = mongoose.model("Patient", patientSchema);