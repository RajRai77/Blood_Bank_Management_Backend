import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Patient } from "../models/patient.model.js";
import { Inventory } from "../models/inventory.model.js";

// 1. Add Patient
const addPatient = asyncHandler(async (req, res) => {
    const { name, age, gender, bloodGroup, contact, diagnosis } = req.body;

    const patient = await Patient.create({
        hospitalId: req.user._id,
        name, age, gender, bloodGroup, contact, diagnosis
    });

    return res.status(201).json(new ApiResponse(201, patient, "Patient Admitted Successfully"));
});

// 2. Get All Patients
const getPatients = asyncHandler(async (req, res) => {
    const patients = await Patient.find({ 
        hospitalId: req.user._id, 
        status: "Admitted" 
    }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, patients, "Patients Fetched"));
});

// 3. DISPENSE BLOOD (The Core Feature)
const dispenseBlood = asyncHandler(async (req, res) => {
    const { id } = req.params; // Patient ID
    const { bloodGroup, component, quantity, usageType, price } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) throw new ApiError(404, "Patient not found");

    // A. Check Inventory
    const stock = await Inventory.find({
        organization: req.user._id,
        bloodGroup: bloodGroup,
        inventoryType: component,
        status: "available"
    }).limit(quantity);

    if (stock.length < quantity) {
        throw new ApiError(400, `Insufficient Stock. Available: ${stock.length}`);
    }

    // B. Deduct Inventory
    const unitIds = stock.map(u => u._id);
    await Inventory.updateMany({ _id: { $in: unitIds } }, { $set: { status: "out" } });

    // C. Add to Patient History
    patient.bloodHistory.push({
        bloodGroup,
        component,
        quantity,
        usageType, // "Sold" or "Donated"
        price: usageType === "Donated" ? 0 : price // Ensure 0 price if donated
    });
    
    await patient.save();

    return res.status(200).json(new ApiResponse(200, patient, `Blood ${usageType} to Patient successfully`));
});

export { addPatient, getPatients, dispenseBlood };