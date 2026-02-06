import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { Donor } from "../models/donor.model.js";
import { Inventory } from "../models/inventory.model.js"; // Added to clear old stock too
import { DB_name } from "../constants.js";

dotenv.config({ path: './.env' });

const seedData = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}`);
        console.log("🌱 Connected to DB...");

        // 0. CLEAN SLATE (Optional but recommended)
        await User.deleteMany({});
        await Donor.deleteMany({});
        await Inventory.deleteMany({});
        console.log("🧹 Old Data Cleared...");

        // 1. Create Admin
        await User.create({
            name: "Kavi Admin",
            email: "admin@ebloodcare.com",
            password: "123",
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

        // 3. Create Dummy Donors with IDs
        const donors = [
            { 
                donorId: "DNR-1001", 
                firstName: "Sarah", 
                lastName: "Jenkins", 
                phone: "9876543210", 
                email: "sarah@example.com", 
                age: 24, 
                gender: "Female", 
                bloodGroup: "A+", 
                lastDonationDate: new Date() 
            },
            { 
                donorId: "DNR-1002", 
                firstName: "Mike", 
                lastName: "Ross", 
                phone: "9876543210", // Same phone (Family member case)
                // No email for Mike
                age: 30, 
                gender: "Male", 
                bloodGroup: "O-", 
                lastDonationDate: new Date("2023-12-01") 
            },
        ];
        await Donor.insertMany(donors);

        console.log("✅ Database Seeded Successfully with Donor IDs!");
        process.exit();
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seedData();