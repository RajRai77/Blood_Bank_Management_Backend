import mongoose, { Schema } from "mongoose";

const inventorySchema = new Schema({
    organization: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bloodGroup: { 
        type: String, 
        required: true,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] 
    },
    inventoryType: { 
        type: String, 
        required: true, 
        enum: ["Whole Blood", "Plasma", "Red Cells (RBC)", "Platelets"] 
    },
    quantity: { type: Number, required: true },
    status: { type: String, enum: ["available", "out", "expired"], default: "available" },
    
    // --- CAMP / DONOR FIELDS ---
    isTested: { type: Boolean, default: false }, 
    donorName: { type: String }, // Keep for legacy/manual entry
    
    // THE MISSING LINK:
    donor: { type: Schema.Types.ObjectId, ref: "Donor" }, // <--- Add this line!
    
    bagId: { type: String }, 
    unitId: { type: String },
    expiryDate: { type: Date, required: true },

}, { timestamps: true });

export const Inventory = mongoose.model("Inventory", inventorySchema);