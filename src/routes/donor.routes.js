import { Router } from "express";
import { registerDonor, getDonors } from "../controllers/donor.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(verifyJWT);

// Routes
router.route("/").get(getDonors);            // GET /api/v1/donors
router.route("/register").post(registerDonor); // POST /api/v1/donors/register

export default router;