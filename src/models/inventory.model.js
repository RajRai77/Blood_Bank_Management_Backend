import mongoose, { Schema } from "mongoose";

const inventorySchema = new Schema(
  {
    unitId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    inventoryType: {
      type: String,
      enum: ["Whole Blood", "Packed Red Cells", "Plasma", "Platelets"], // NEW: Component Types
      default: "Whole Blood",
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"],
    },
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["available", "reserved", "expired", "quarantined", "processed"], // NEW: 'processed' for split bags
      default: "available",
    },
    
    // NEW: Lab Testing Fields
    isTested: { type: Boolean, default: false },
    testResult: {
       type: String,
       enum: ["Pending", "Safe", "Unsafe"],
       default: "Pending"
    },
    
    expiryDate: { type: Date, required: true },
    location: { type: String },
    
    // Relationships
    donor: { type: Schema.Types.ObjectId, ref: "Donor" },
    organization: { type: Schema.Types.ObjectId, ref: "User" },
    hospital: { type: Schema.Types.ObjectId, ref: "User" },
    
    // NEW: Traceability (If this is Plasma, where did it come from?)
    parentBagId: { type: String } 
  },
  { timestamps: true }
);

export const Inventory = mongoose.model("Inventory", inventorySchema);