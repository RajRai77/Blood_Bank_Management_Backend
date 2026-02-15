import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Inventory } from "../models/inventory.model.js";
import { Donor } from "../models/donor.model.js"; // We need this to link donor
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";



// 1. ADD NEW BLOOD BAG (Corrected for New Schema)
const addInventory = asyncHandler(async (req, res) => {
    // 1. Accept donorId directly
    const { bloodGroup, quantity, expiryDate, inventoryType, donorId, email } = req.body;

    // 2. Resolve Donor
    let finalDonorId = donorId;

    // If ID not sent but Email is, look it up (Backward Compatibility)
    if (!finalDonorId && email) {
        const user = await User.findOne({ email });
        if (user) finalDonorId = user._id;
    }

    if (!finalDonorId) {
        throw new ApiError(400, "Donor is required (Select from list)");
    }

    // 3. Create Inventory Item
    const inventory = await Inventory.create({
        organization: req.user._id,
        bloodGroup,
        quantity,
        inventoryType,
        expiryDate,
        donor: finalDonorId, // Link to User Model
        unitId: `UNIT-${Date.now()}-${Math.floor(Math.random()*1000)}`, // Auto-generate
        status: "available",
        isTested: false
    });

    return res.status(201).json(new ApiResponse(201, inventory, "Stock Added Successfully"));
});

// 2. GET INVENTORY (The Missing Main Function)
const getInventory = asyncHandler(async (req, res) => {
    // A. Filter by YOUR Organization
    const filters = { organization: req.user._id };

    // B. Apply URL Filters (e.g., ?bloodGroup=A+)
    if (req.query.bloodGroup && req.query.bloodGroup !== "All") {
        filters.bloodGroup = req.query.bloodGroup;
    }
    if (req.query.inventoryType && req.query.inventoryType !== "All") {
        filters.inventoryType = req.query.inventoryType;
    }
    if (req.query.status) {
        filters.status = req.query.status;
    }

    // C. Fetch Data
    const inventory = await Inventory.find(filters)
        .populate("donor", "name email bloodGroup") // Fixed fields
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, inventory, "Inventory Fetched"));
});

const deleteInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const item = await Inventory.findById(id);
    if (!item) throw new ApiError(404, "Item not found");

    await Inventory.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, {}, "Inventory Item Deleted Successfully"));
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

export { addInventory, getInventoryStats, getRecentInventory,deleteInventoryItem , getInventory};