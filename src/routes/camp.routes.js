import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createCamp, getCamps, registerDonor, updateDonorStatus } from "../controllers/camp.controller.js";

const router = Router();

// --- PUBLIC ROUTES (No Login Required) ---
// Allows Walk-in Registration Kiosks or Public Links
router.route("/:id/register").post(registerDonor);

// --- PROTECTED ROUTES (Admin/Hospital Login Required) ---
router.use(verifyJWT);

router.route("/")
    .get(getCamps)      // View My Camps
    .post(createCamp);  // Schedule New Camp

router.route("/:id/donor/:donorId").put(updateDonorStatus); // Update Status (Screening/Collection)

export default router;