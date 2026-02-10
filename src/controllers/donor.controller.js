import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Donor } from "../models/donor.model.js";

// 1. Register New Donor (Updated to calculate Age)
const registerDonor = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, bloodGroup, dateOfBirth, gender, address } = req.body;

    // Validation: Ensure required fields are present
    if (!firstName || !email || !bloodGroup || !dateOfBirth) {
        throw new ApiError(400, "All fields (First Name, Email, Blood Group, DOB) are required");
    }

    // Check for Duplicates
    const existingDonor = await Donor.findOne({ $or: [{ email }, { phone }] });
    if (existingDonor) {
        throw new ApiError(409, "Donor with this email or phone already exists");
    }

    // --- CALCULATION: Get Age from Date of Birth ---
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    
    // Adjust age if birthday hasn't happened yet this year
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    // Generate a random Donor ID
    const donorId = "DNR-" + Math.floor(1000 + Math.random() * 9000);

    try {
        const donor = await Donor.create({
            firstName, 
            lastName, 
            email, 
            phone, 
            bloodGroup, 
            dateOfBirth, 
            age, // <--- NOW INCLUDED (Fixes the validation error)
            gender, 
            address, 
            donorId,
            organization: req.user._id // Links donor to the admin
        });

        return res.status(201).json(new ApiResponse(201, donor, "Donor Registered Successfully"));

    } catch (error) {
        console.log("❌ REGISTRATION ERROR:", error.message); 
        // If schema fails (e.g., age missing), this log will appear in terminal
        throw new ApiError(500, error.message || "Server Error while registering donor");
    }
});

// 2. Get All Donors (With Search)
const getDonors = asyncHandler(async (req, res) => {
    const { search } = req.query;
    let query = {};

    if (search) {
        query = {
            $or: [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { donorId: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ]
        };
    }

    // Fetch donors sorted by newest first
    const donors = await Donor.find(query).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, donors, "Donors Fetched Successfully"));
});

export { registerDonor, getDonors };