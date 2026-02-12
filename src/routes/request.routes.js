import { Router } from "express";
import { 
    createRequest, 
    getRequests, 
    updateRequestStatus, 
    verifyDeliveryOTP, 
    getPublicRequestDetails,
    submitPayment
} from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// --- PUBLIC ROUTES (Driver App - No Login Required) ---
// MUST be defined BEFORE verifyJWT
router.route("/:id/verify-otp").post(verifyDeliveryOTP);
router.route("/:id/public").get(getPublicRequestDetails);

// --- PROTECTED ROUTES (Dashboard - Login Required) ---
router.use(verifyJWT); // Acts as a gatekeeper for everything below

router.route("/")
    .get(getRequests)      // View All
    .post(createRequest);  // Create New

router.route("/:id/status").put(updateRequestStatus); // Approve/Reject\
router.route("/:id/payment").put(submitPayment);

export default router;