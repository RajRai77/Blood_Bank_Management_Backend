import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { BloodRequest } from "../models/request.model.js";
import { Inventory } from "../models/inventory.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. CREATE REQUEST (Hospital asking for blood)
const createBloodRequest = asyncHandler(async (req, res) => {
    const { bloodGroup, unitsRequired, urgency, reason, patientName } = req.body;

    if (!bloodGroup || !unitsRequired) {
        throw new ApiError(400, "Blood Group and Units Required are mandatory");
    }

    const request = await BloodRequest.create({
        hospital: req.user._id, // From verifyJWT
        bloodGroup,
        unitsRequired,
        urgency,
        reason,
        patientName,
        status: "Pending"
    });

    return res
        .status(201)
        .json(new ApiResponse(201, request, "Blood Request Submitted Successfully"));
});

// 2. GET ALL REQUESTS (For Admin Dashboard)
const getAllRequests = asyncHandler(async (req, res) => {
    // Admins see ALL, Hospitals see only THEIRS
    const filter = req.user.role === "admin" ? {} : { hospital: req.user._id };

    const requests = await BloodRequest.find(filter)
        .populate("hospital", "name email phone hospitalName") // Show who asked
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, requests, "Requests Fetched Successfully"));
});

// 3. UPDATE STATUS (The "Smart" Approval)
const updateRequestStatus = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body; // "Approved", "Rejected", "Fulfilled"

    // Only Admin can approve
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only Admins can process requests");
    }

    const request = await BloodRequest.findById(requestId);
    if (!request) {
        throw new ApiError(404, "Request not found");
    }

    // IF APPROVING: Check Stock & Reserve Units
    if (status === "Approved" && request.status !== "Approved") {
        // A. Count available units
        const availableUnits = await Inventory.find({
            bloodGroup: request.bloodGroup,
            status: "available"
        }).limit(request.unitsRequired);

        // B. Check if enough stock
        if (availableUnits.length < request.unitsRequired) {
            throw new ApiError(400, `Insufficient Stock! Only ${availableUnits.length} units of ${request.bloodGroup} available.`);
        }

        // C. "Reserve" the units (Update Inventory)
        const unitIds = availableUnits.map(unit => unit._id);
        await Inventory.updateMany(
            { _id: { $in: unitIds } },
            { 
                $set: { 
                    status: "reserved", 
                    hospital: request.hospital // Link to hospital
                } 
            }
        );
    }

    // Update Request Status
    request.status = status;
    await request.save();

    return res
        .status(200)
        .json(new ApiResponse(200, request, `Request ${status} Successfully`));
});

export { createBloodRequest, getAllRequests, updateRequestStatus };