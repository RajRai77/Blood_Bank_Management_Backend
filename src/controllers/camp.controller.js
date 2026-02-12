import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Camp } from "../models/camp.model.js";
import { Inventory } from "../models/inventory.model.js";

// 1. Create Camp
const createCamp = asyncHandler(async (req, res) => {
    const { name, location, date, time, targetUnits } = req.body;
    const camp = await Camp.create({
        organizer: req.user._id,
        name, location, date, time, targetUnits
    });
    return res.status(201).json(new ApiResponse(201, camp, "Camp Scheduled"));
});

// 2. Get Camps
const getCamps = asyncHandler(async (req, res) => {
    const camps = await Camp.find({ organizer: req.user._id }).sort({ date: 1 });
    return res.status(200).json(new ApiResponse(200, camps, "Camps Fetched"));
});

// 3. Register Donor (Walk-in or Pre-reg)
const registerDonor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone, age, gender, bloodGroup } = req.body;

    const camp = await Camp.findById(id);
    if (!camp) throw new ApiError(404, "Camp not found");

    camp.donors.push({ name, phone, age, gender, bloodGroup, status: "Registered" });
    await camp.save();

    return res.status(200).json(new ApiResponse(200, camp, "Donor Registered"));
});

// 4. UPDATE DONOR STATUS (The Core Logic)
const updateDonorStatus = asyncHandler(async (req, res) => {
    const { id, donorId } = req.params;
    const { status, bagId } = req.body; 

    const camp = await Camp.findById(id);
    if (!camp) throw new ApiError(404, "Camp not found");

    const donor = camp.donors.id(donorId);
    if (!donor) throw new ApiError(404, "Donor not found");

    // LOGIC: If status becomes "Donated", add to Inventory
    if (status === "Donated" && donor.status !== "Donated") {
        
        if (!donor.bloodGroup) throw new ApiError(400, "Blood Group required for donation");

        try {
            // 1. Calculate Expiry (35 days for Whole Blood)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 35);

            // 2. Generate the Unique ID (Barcode)
            // If the user scanned a bag, use that. Otherwise, generate one.
            const uniqueId = bagId || `CAMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;

            // 3. Create Inventory Record
            await Inventory.create({
                organization: req.user._id,
                bloodGroup: donor.bloodGroup,
                quantity: 1, 
                inventoryType: "Whole Blood",
                status: "available",
                
                // --- FIX: Provide BOTH bagId and unitId ---
                unitId: uniqueId,  // <--- Satisfies the Database Requirement
                bagId: uniqueId,   // <--- For our reference
                
                isTested: false,   // Must be tested in Lab later
                donorName: donor.name,
                expiryDate: expiryDate
            });

        } catch (error) {
            console.error("INVENTORY CREATION FAILED:", error);
            // Send the actual error message back to the frontend for easier debugging
            throw new ApiError(500, `Inventory Error: ${error.message}`);
        }
    }

    donor.status = status;
    // Save the bag ID to the donor record too so we can trace it back
    if(bagId || donor.status === "Donated") {
        donor.bagId = bagId || `CAMP-${Date.now()}`; 
    }
    
    await camp.save();

    return res.status(200).json(new ApiResponse(200, camp, `Donor status updated to ${status}`));
});
export { createCamp, getCamps, registerDonor, updateDonorStatus };