import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Delivery } from "../models/delivery.model.js";
import { BloodRequest } from "../models/request.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. ASSIGN DRIVER (Admin assigns a driver to a Request)
const assignDriver = asyncHandler(async (req, res) => {
    const { requestId, driverId, estimatedTime } = req.body;

    // A. Check if Request exists and is Approved
    const request = await BloodRequest.findById(requestId);
    if (!request || request.status !== "Approved") {
        throw new ApiError(400, "Request must be 'Approved' before assigning logistics.");
    }

    // B. Check Driver
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== "driver") {
        throw new ApiError(404, "Valid Driver not found.");
    }

    // C. Create Delivery Record (Start at Central Blood Bank Coordinates)
    const delivery = await Delivery.create({
        request: requestId,
        driver: driverId,
        currentLocation: { lat: 19.0760, lng: 72.8777 }, // Default: Mumbai (Change to your city)
        estimatedTime: estimatedTime || "20 mins",
        status: "In Transit"
    });

    // D. Update Request Status
    request.status = "Fulfilled"; // Or "In Transit" depending on your flow
    await request.save();

    // E. Notify Driver
    await Notification.create({
        user: driverId,
        message: `New Delivery Assigned: ${request.unitsRequired} units of ${request.bloodGroup}`,
        type: "alert"
    });

    return res.status(201).json(new ApiResponse(201, delivery, "Driver Assigned & Delivery Started"));
});

// 2. UPDATE LOCATION (Driver's Phone hits this every 10 seconds)
const updateLocation = asyncHandler(async (req, res) => {
    const { deliveryId } = req.params;
    const { lat, lng } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(
        deliveryId,
        { 
            $set: { 
                "currentLocation.lat": lat, 
                "currentLocation.lng": lng 
            }
        },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, delivery, "Location Updated"));
});

// 3. COMPLETE DELIVERY (Nurse Signs)
const completeDelivery = asyncHandler(async (req, res) => {
    const { deliveryId } = req.params;
    const { recipientName, signatureUrl } = req.body; // URL from Frontend upload

    const delivery = await Delivery.findByIdAndUpdate(
        deliveryId,
        {
            status: "Delivered",
            endTime: Date.now(),
            recipientName,
            signatureUrl
        },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, delivery, "Delivery Completed Successfully"));
});

export { assignDriver, updateLocation, completeDelivery };