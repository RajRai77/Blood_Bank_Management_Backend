import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Inventory } from "../models/inventory.model.js";
import { Donor } from "../models/donor.model.js"; // We need this to link donor
import { ApiResponse } from "../utils/ApiResponse.js";


// 1. ADD NEW BLOOD BAG (Updated: Uses Donor ID)
const addInventory = asyncHandler(async (req, res) => {
    // We now expect 'donorId' from the frontend
    const { donorId, bloodGroup, quantity, location } = req.body;

    // A. Verify Donor Exists using unique ID
    if (!donorId) {
        throw new ApiError(400, "Donor ID is required");
    }

    const donor = await Donor.findOne({ donorId });
    
    if (!donor) {
        throw new ApiError(404, `Donor with ID ${donorId} not found.`);
    }

    // B. Generate Unit ID for the BAG (e.g., #88291)
    const unitId = "#" + Math.floor(10000 + Math.random() * 90000).toString();

    // C. Create Inventory
    const bloodBag = await Inventory.create({
        unitId,
        bloodGroup: bloodGroup || donor.bloodGroup,
        quantity: quantity || 1,
        location: location || "Main Storage",
        expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), 
        donor: donor._id,
        organization: req.user._id, 
        inventoryType: "in",
        status: "available"
    });

    return res
        .status(201)
        .json(new ApiResponse(201, bloodBag, "New Blood Unit Added Successfully"));
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
    const recent = await Inventory.find()
        .sort({ createdAt: -1 }) // Newest first
        .limit(5)
        .populate("donor", "firstName lastName"); // Show Donor Name

    return res
        .status(200)
        .json(new ApiResponse(200, recent, "Recent Activity Fetched"));
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