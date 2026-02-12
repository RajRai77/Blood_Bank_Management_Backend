import mongoose, { Schema } from "mongoose";

const campSchema = new Schema({
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true }, // e.g., "City College Drive"
    location: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "9:00 AM - 4:00 PM"
    targetUnits: { type: Number, required: true },
    
    // The Pipeline
    donors: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        bloodGroup: { type: String }, // Known after screening
        age: Number,
        gender: String,
        status: { 
            type: String, 
            enum: ["Registered", "Screened - Fit", "Screened - Unfit", "Donated"], 
            default: "Registered" 
        },
        bagId: { type: String }, // Barcode on the blood bag
        certificateId: { type: String }
    }],

    status: { type: String, enum: ["Upcoming", "Active", "Completed"], default: "Upcoming" }
}, { timestamps: true });

export const Camp = mongoose.model("Camp", campSchema);