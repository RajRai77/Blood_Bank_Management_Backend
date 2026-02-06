import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createBloodRequest, 
    getAllRequests, 
    updateRequestStatus 
} from "../controllers/request.controller.js";

const router = Router();

router.use(verifyJWT); // Protect all routes

router.route("/create").post(createBloodRequest); // Hospital creates
router.route("/").get(getAllRequests);            // Admin sees all, Hospital sees theirs
router.route("/:requestId/status").put(updateRequestStatus); // Admin approves

export default router;