import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Inventory } from "../models/inventory.model.js";
import { Donor } from "../models/donor.model.js"; // We need this to link donor
import { ApiResponse } from "../utils/ApiResponse.js";



// 1. ADD NEW BLOOD BAG (Corrected for New Schema)
const addInventory = asyncHandler(async (req, res) => {
    // 1. Accept 'volume' from the frontend
    const { donorId, bloodGroup, quantity, location, volume } = req.body; 

    if (!donorId) throw new ApiError(400, "Donor ID is required");

    const donor = await Donor.findOne({ donorId });
    if (!donor) throw new ApiError(404, `Donor ${donorId} not found.`);

    const unitId = "#" + Math.floor(10000 + Math.random() * 90000).toString();

    const bloodBag = await Inventory.create({
        unitId,
        bloodGroup: bloodGroup || donor.bloodGroup,
        quantity: quantity || 1,
        location: location || "Main Storage",
        expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        donor: donor._id,
        organization: req.user._id,
        inventoryType: "Whole Blood",
        
        // --- NEW FIELD ---
        // If user doesn't type it, default to standard 450ml
        volume: volume || 450, 
        
        isTested: false,
        testResult: "Pending",
        status: "available"
    });

    return res.status(201).json(new ApiResponse(201, bloodBag, "New Blood Unit Added"));
});

// 2. GET DASHBOARD STATS (The "Wow" Factor)
const getInventoryStats = asyncHandler(async (req, res) => {
    // This Aggregation Pipeline calculates counts instantly
    const stats = await Inventory.aggregate([
        {
            $match: { status: "available" } // Only count safe blood
        },
        {
            $group: {
                _id: "$bloodGroup", // Group by A+, O-, etc.
                totalUnits: { $sum: "$quantity" } // Count them
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Inventory Stats Fetched"));
});

// 3. GET RECENT ACTIVITY (For the Sidebar)
const getRecentInventory = asyncHandler(async (req, res) => {
    // 1. Extract all possible filters from URL
    const { bloodGroup, inventoryType, status, isTested } = req.query;

    // 2. Build Query Object
    let query = {};

    if (bloodGroup && bloodGroup !== "All") query.bloodGroup = bloodGroup;
    if (inventoryType && inventoryType !== "All") query.inventoryType = inventoryType;
    if (status && status !== "All") query.status = status;

    // --- NEW: Handle Boolean Filter for Lab ---
    if (isTested !== undefined) {
        // Convert string "false"/"true" to actual boolean
        query.isTested = isTested === "true";
    }

    // 3. Run Query
    const inventory = await Inventory.find(query)
        .populate("donor", "firstName lastName donorId")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, inventory, "Inventory Fetched Successfully"));
});

export const getCertificate = asyncHandler(async (req, res) => {
    const { donorId } = req.params;
    
    // Find donor using the custom ID (e.g., DNR-1001)
    const donor = await Donor.findOne({ donorId });
    if (!donor) throw new ApiError(404, "Donor not found");

    const certificate = {
        certId: `CERT-${Date.now()}`,
        donorName: `${donor.firstName} ${donor.lastName}`,
        bloodGroup: donor.bloodGroup,
        date: new Date().toLocaleDateString(),
        message: "Thank you for being a hero!"
    };

    return res.status(200).json(new ApiResponse(200, certificate, "Certificate Generated"));
});

export { addInventory, getInventoryStats, getRecentInventory };