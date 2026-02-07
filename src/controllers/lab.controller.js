import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Inventory } from "../models/inventory.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. RECORD TEST RESULTS (TTI Screening)
const updateTestResults = asyncHandler(async (req, res) => {
    const { unitId, hiv, hbv, hcv, malaria, syphilis } = req.body;

    // Check if any test is positive (true = infected)
    const isUnsafe = hiv || hbv || hcv || malaria || syphilis;
    const testStatus = isUnsafe ? "Unsafe" : "Safe";
    const bagStatus = isUnsafe ? "quarantined" : "available";

    const bloodBag = await Inventory.findOneAndUpdate(
        { unitId },
        { 
            isTested: true,
            testResult: testStatus,
            status: bagStatus
        },
        { new: true }
    );

    if (!bloodBag) throw new ApiError(404, "Blood Bag not found");

    return res.status(200).json(new ApiResponse(200, bloodBag, `Lab Results Recorded: Bag is ${testStatus}`));
});

// 2. COMPONENT SEPARATION (The "Centrifuge" Logic)
const processBloodComponents = asyncHandler(async (req, res) => {
    const { unitId, components } = req.body; // e.g. ["Packed Red Cells", "Plasma"]

    // A. Verify Source Bag
    const parentBag = await Inventory.findOne({ unitId });
    if (!parentBag) throw new ApiError(404, "Source Bag not found");
    if (!parentBag.isTested || parentBag.testResult !== "Safe") {
        throw new ApiError(400, "Cannot process untested or unsafe blood");
    }

    const newBags = [];

    // B. Create Components
    for (const type of components) {
        // Create Sub-ID: #88291 -> #88291-P (Plasma), #88291-R (RBC)
        const suffix = type === "Plasma" ? "-P" : "-R";
        const subId = unitId + suffix;

        const componentBag = await Inventory.create({
            unitId: subId,
            bloodGroup: parentBag.bloodGroup,
            inventoryType: type,
            quantity: 1,
            location: parentBag.location, // Same fridge for now
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Reset expiry
            donor: parentBag.donor,
            organization: req.user._id,
            isTested: true,
            testResult: "Safe",
            parentBagId: unitId,
            status: "available"
        });
        newBags.push(componentBag);
    }

    // C. Mark Parent Bag as Consumed
    parentBag.status = "processed";
    parentBag.quantity = 0;
    await parentBag.save();

    return res.status(201).json(new ApiResponse(201, newBags, "Blood Separated into Components Successfully"));
});

export { updateTestResults, processBloodComponents };