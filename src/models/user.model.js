import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        role: {
            type: String,
            enum: ["admin", "hospital", "staff", "driver"],
            default: "staff",
            required: true
        },
        // For Hospitals/Orgs
        hospitalName: {
            type: String,
            required: function() { return this.role === 'hospital'; }
        },
        // For Drivers
        isAvailable: {
            type: Boolean,
            default: true
        },
        // Common Info
        phone: { type: String, required: true },
        address: { type: String },
        refreshToken: { type: String }
    },
    { timestamps: true }
);

// Encrypt Password
userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
})

// Check Password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

// Generate Access Token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role,
            name: this.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

export const User = mongoose.model("User", userSchema)