import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Inventory } from "../models/inventory.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. GET UNITS PENDING TTI SCREENING
// Logic: Fetch only units where isTested is FALSE
const getUntestedUnits = asyncHandler(async (req, res) => {
    const units = await Inventory.find({
        organization: req.user._id,
        isTested: false, // <--- Only show untested here
        status: { $ne: "out" } // Don't show discarded ones
    }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, units, "Untested units fetched"));
});

// 2. GET SAFE UNITS FOR COMPONENT SEPARATION
// Logic: Fetch Tested + Safe + Whole Blood
const getSafeUnits = asyncHandler(async (req, res) => {
    const units = await Inventory.find({
        organization: req.user._id,
        isTested: true,          // <--- Must be tested
        status: "available",     // <--- Must be Safe
        inventoryType: "Whole Blood" // Only Whole Blood can be separated
    }).sort({ updatedAt: -1 });

    return res.status(200).json(new ApiResponse(200, units, "Safe units ready for processing"));
});

// 3. UPDATE TTI RESULTS (The Fix for "Stuck in Tab")
const updateTestResults = asyncHandler(async (req, res) => {
    const { unitId, hiv, hbv, hcv, malaria, syphilis } = req.body;

    // 1. Check if ANY test is positive (Unsafe)
    const isUnsafe = [hiv, hbv, hcv, malaria, syphilis].some(test => test === true);

    // 2. Determine Status
    // If Unsafe -> Status is "out" (Discarded)
    // If Safe   -> Status is "available"
    const newStatus = isUnsafe ? "out" : "available";

    // 3. Update the Inventory
    const unit = await Inventory.findOneAndUpdate(
        { unitId: unitId },
        {
            $set: {
                // Save Medical Results
                "testResults.hiv": hiv,
                "testResults.hbv": hbv,
                "testResults.hcv": hcv,
                "testResults.malaria": malaria,
                "testResults.syphilis": syphilis,
                
                // --- CRITICAL FIXES ---
                isTested: true,      // <--- Mark as Tested so it leaves Screening Tab
                status: newStatus,   // <--- Mark as Available (Safe Tab) or Out
                testedAt: new Date()
            }
        },
        { new: true }
    );

    if (!unit) throw new ApiError(404, "Unit not found");

    return res.status(200).json(new ApiResponse(200, unit, "Test Results Updated"));
});

// 4. PROCESS COMPONENTS (Split Whole Blood)
const processComponents = asyncHandler(async (req, res) => {
    const { unitId, components } = req.body; // e.g. ["Plasma", "Packed Red Cells"]

    const originalUnit = await Inventory.findOne({ unitId });
    if (!originalUnit) throw new ApiError(404, "Original unit not found");

    const newBags = components.map(type => {
        // --- THE FIX: Map Frontend Name to Backend Database Name ---
        let dbType = type;
        if (type === "Packed Red Cells") dbType = "Red Cells (RBC)";

        return {
            organization: req.user._id,
            bloodGroup: originalUnit.bloodGroup,
            inventoryType: dbType, // <--- Use the corrected name
            quantity: 1,
            status: "available",
            isTested: true, 
            donor: originalUnit.donor,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
            unitId: `${originalUnit.unitId}-${type.substring(0, 3).toUpperCase()}`,
            // Ensure schema supports 'sourceUnitId' or remove this line if strictly validating
            // sourceUnitId: originalUnit.unitId 
        };
    });

    await Inventory.insertMany(newBags);

    // Mark Original Bag as Empty/Out
    originalUnit.status = "out";
    originalUnit.quantity = 0;
    await originalUnit.save();

    return res.status(200).json(new ApiResponse(200, newBags, "Components Separated Successfully"));
});

export { getUntestedUnits, getSafeUnits, updateTestResults, processComponents };