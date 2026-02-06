import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Inventory } from "../models/inventory.model.js";
import { Donor } from "../models/donor.model.js"; // We need this to link donor
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. ADD NEW BLOOD BAG (When a Donor donates)
const addInventory = asyncHandler(async (req, res) => {
    const { email, bloodGroup, quantity, location } = req.body;

    // A. Verify Donor Exists
    const donor = await Donor.findOne({ email });
    if (!donor) {
        throw new ApiError(404, "Donor not found. Please register donor first.");
    }

    // B. Generate a Random Unit ID (e.g., #88291) to mimic the UI
    const unitId = "#" + Math.floor(10000 + Math.random() * 90000).toString();

    // C. Create the Inventory Record
    const bloodBag = await Inventory.create({
        unitId,
        bloodGroup, // e.g., "A+"
        quantity: 1, // Standard unit
        location: location || "Main Storage",
        expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // Expires in 42 days
        donor: donor._id,
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

export { addInventory, getInventoryStats, getRecentInventory };