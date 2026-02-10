import { Router } from "express";
import { createRequest, getRequests, updateRequestStatus } from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/")
    .get(getRequests)      // View All
    .post(createRequest);  // Create New

router.route("/:id/status").put(updateRequestStatus); // Approve/Reject

export default router;