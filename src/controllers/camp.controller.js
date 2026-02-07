import { asyncHandler } from "../utils/asyncHandler.js";
import { Camp } from "../models/camp.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createCamp = asyncHandler(async (req, res) => {
    const { name, address, date, startTime, endTime } = req.body;
    
    const camp = await Camp.create({
        organizer: req.user._id,
        name,
        address,
        date,
        startTime,
        endTime
    });

    return res.status(201).json(new ApiResponse(201, camp, "Camp Scheduled Successfully"));
});

const getCamps = asyncHandler(async (req, res) => {
    // Return all future camps
    const camps = await Camp.find().sort({ date: 1 });
    return res.status(200).json(new ApiResponse(200, camps, "Camps Fetched"));
});

export { createCamp, getCamps };