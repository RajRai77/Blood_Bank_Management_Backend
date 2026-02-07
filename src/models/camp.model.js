import mongoose, { Schema } from "mongoose";

const campSchema = new Schema({
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
    name: { type: String, required: true }, // "Red Cross Annual Drive"
    address: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String }, // "10:00 AM"
    endTime: { type: String },   // "4:00 PM"
    expectedDonors: { type: Number },
    status: { 
        type: String, 
        enum: ["Scheduled", "Ongoing", "Completed", "Cancelled"],
        default: "Scheduled"
    }
}, { timestamps: true });

export const Camp = mongoose.model("Camp", campSchema);