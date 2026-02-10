import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Request } from "../models/request.model.js";
import { Inventory } from "../models/inventory.model.js";

const createRequest = asyncHandler(async (req, res) => {
    const { recipientId, requesterName, patientName, bloodGroup, requestType, quantity, priority } = req.body;

    let validRequesterType = "Individual";
    if (req.user.role === "hospital" || req.user.role === "admin") validRequesterType = "Hospital";
    else if (req.user.role === "organization") validRequesterType = "Clinic";

    const request = await Request.create({
        requesterId: req.user._id, // <--- SAVE SENDER ID
        requesterName, 
        requesterType: validRequesterType,
        patientName, 
        bloodGroup, 
        requestType, 
        quantity, 
        priority,
        // The recipient (Organization)
        organization: recipientId || req.user._id 
    });

    return res.status(201).json(new ApiResponse(201, request, "Blood Request Created"));
});

// 2. Get All Requests (For Admin Dashboard)
const getRequests = asyncHandler(async (req, res) => {
    const { status } = req.query;
    let query = {}; 

    if (status && status !== "All") query.status = status;

    // CRITICAL FIX:
    // Show request if I am the Recipient (organization) OR the Sender (requesterId)
    // Admin sees everything.
    if (req.user.role !== "admin") {
        query.$or = [
            { organization: req.user._id }, // Incoming
            { requesterId: req.user._id }   // Outgoing
        ];
    }

    const requests = await Request.find(query)
        .populate("organization", "name email phone address") // Who received it
        .populate("requesterId", "name email phone address")  // Who sent it
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, requests, "Requests Fetched"));
});
// 3. UPDATE STATUS (Approve/Reject)
const updateRequestStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, deliveryDetails } = req.body; // Expect delivery info on approval

    const request = await Request.findById(id);
    if (!request) throw new ApiError(404, "Request not found");

    // Stock deduction logic (Only if approving)
    if (status === "approved") {
        const availableStock = await Inventory.find({
            bloodGroup: request.bloodGroup,
            inventoryType: request.requestType,
            status: "available",
            isTested: true
        }).limit(request.quantity);

        if (availableStock.length < request.quantity) {
            throw new ApiError(400, "Insufficient Stock");
        }
        
        // Deduct Stock
        const unitIds = availableStock.map(u => u._id);
        await Inventory.updateMany({ _id: { $in: unitIds } }, { $set: { status: "out" } });
        
        // Save Delivery Details
        if(deliveryDetails) {
            request.deliveryDetails = {
                ...deliveryDetails,
                startedAt: new Date()
            };
        }
    }

    request.status = status;
    await request.save();

    return res.status(200).json(new ApiResponse(200, request, `Request ${status}`));
});
export { createRequest, getRequests, updateRequestStatus };