//Just to Fill Dummy Data
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { Donor } from "../models/donor.model.js";
import { DB_name } from "../constants.js";

dotenv.config({ path: './.env' });

const seedData = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}${DB_name}`);
        console.log("🌱 Connected to DB...");

        // 1. Create Admin
        await User.create({
            name: "Kavi Admin",
            email: "admin@ebloodcare.com",
            password: "123", // Will be hashed by pre-save hook
            role: "admin",
            phone: "9999999999"
        });

        // 2. Create Hospital
        await User.create({
            name: "St. Mary's Admin",
            email: "stmary@hospital.com",
            password: "123",
            role: "hospital",
            hospitalName: "St. Mary's Hospital",
            phone: "8888888888"
        });

        // 3. Create Dummy Donors
        const donors = [
            { firstName: "Sarah", lastName: "Jenkins", phone: "123", age: 24, gender: "Female", bloodGroup: "A+", lastDonationDate: new Date() },
            { firstName: "Mike", lastName: "Ross", phone: "124", age: 30, gender: "Male", bloodGroup: "O-", lastDonationDate: new Date("2023-12-01") },
        ];
        await Donor.insertMany(donors);

        console.log("✅ Database Seeded Successfully!");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seedData();