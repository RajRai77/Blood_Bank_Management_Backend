import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Request } from "../models/request.model.js";
import { Inventory } from "../models/inventory.model.js";
import { io } from "../index.js"; // Import IO to emit events

const createRequest = asyncHandler(async (req, res) => {
    const { recipientId, requesterName, patientName, bloodGroup, requestType, quantity, priority, price} = req.body;

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
        organization: recipientId || req.user._id,

        payment: {
            amount: price || 0, // Default to 0 if not sent
            status: "Pending",
            method: "Pending"
        }
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

// --- 4. ROBUST VERIFY OTP (The Fix) ---
const verifyDeliveryOTP = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { otp } = req.body; // Expecting { otp: "6309" }

    const request = await Request.findById(id);
    if (!request) throw new ApiError(404, "Request not found");

    // DEBUGGING: Log what we are comparing
    console.log(`Verifying OTP for ${id}: DB=[${request.deliveryDetails?.deliveryOTP}] Input=[${otp}]`);

    // Normalize both values (String & Trim) to avoid type mismatches
    const dbOTP = String(request.deliveryDetails?.deliveryOTP || "").trim();
    const inputOTP = String(otp || "").trim();

    // Check if DB OTP is empty (Means approval failed previously)
    if (!dbOTP) {
        throw new ApiError(400, "This request does not have an OTP generated. Was it approved correctly?");
    }

    if (dbOTP !== inputOTP) {
        throw new ApiError(400, "Incorrect OTP. Please check the receiver's screen again.");
    }

    // Success Logic
    request.status = "completed";
    request.deliveryDetails.completedAt = new Date();
    await request.save();

    if(io) {
        io.to(id).emit("delivery_completed", { 
            completedAt: request.deliveryDetails.completedAt 
        });
    }

    return res.status(200).json(new ApiResponse(200, request, "Delivery Verified Successfully"));
});
// 3. UPDATE STATUS (Approve/Reject)
const updateRequestStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, deliveryDetails, paymentDetails} = req.body; // Expect delivery info on approval

    const request = await Request.findById(id);
    if (!request) throw new ApiError(404, "Request not found");

    // LOGIC: If we are approving, we MUST have delivery details and stock
    if (status === "approved") {
        
        // 1. Validate Input
        if (!deliveryDetails) {
            throw new ApiError(400, "Cannot approve without Delivery Details (Driver Name, Vehicle, etc.)");
        }

        // 2. Check Stock
        const availableStock = await Inventory.find({
            bloodGroup: request.bloodGroup,
            inventoryType: request.requestType,
            status: "available",
            isTested: true
        }).limit(request.quantity);

        if (availableStock.length < request.quantity) {
            throw new ApiError(400, `Insufficient Stock: Only ${availableStock.length} units available.`);
        }
        
        // 3. Deduct Stock
        const unitIds = availableStock.map(u => u._id);
        await Inventory.updateMany({ _id: { $in: unitIds } }, { $set: { status: "out" } });

        // 4. Generate & Save OTP (Ensuring it's a String)
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // Save Delivery Details

        request.deliveryDetails = {
            ...request.deliveryDetails, 
            ...deliveryDetails,         
            deliveryOTP: otp,           
            startedAt: new Date()
        };

        // F. SAVE UPI ID (The Missing Piece!)
        if (paymentDetails && paymentDetails.upiId) {
            request.payment.upiId = paymentDetails.upiId;
            request.payment.paymentNote = paymentDetails.paymentNote || "";
            // Ensure payment status starts as Pending if not set
            if (!request.payment.status) request.payment.status = "Pending";
        }
        
        // Notify Mongoose that nested objects changed
        request.markModified('deliveryDetails');
        request.markModified('payment');
    }

    request.status = status;
    await request.save();

    return res.status(200).json(new ApiResponse(200, request, `Request ${status}`));
});
const getPublicRequestDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const request = await Request.findById(id)
        .populate("organization", "name phone address email") 
        .select("patientName bloodGroup quantity deliveryDetails organization requesterName"); 

    if (!request) throw new ApiError(404, "Request not found");

    return res.status(200).json(new ApiResponse(200, request, "Public Details Fetched"));
});

// 3. NEW: Submit Payment (For Requester)
const submitPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { method, transactionId } = req.body;

    const request = await Request.findById(id);
    if (!request) throw new ApiError(404, "Request not found");

    // Initialize payment object if missing
    if (!request.payment) {
        request.payment = { amount: 0, status: "Pending", method: "Pending" };
    }

    request.payment.method = method; // "Online" or "COD"
    request.payment.transactionId = transactionId || "";
    request.payment.status = method === "Online" ? "Paid" : "Pending"; 

    await request.save();

    return res.status(200).json(new ApiResponse(200, request, "Payment Details Submitted"));
});

export { createRequest, getRequests, updateRequestStatus, verifyDeliveryOTP,getPublicRequestDetails, submitPayment };