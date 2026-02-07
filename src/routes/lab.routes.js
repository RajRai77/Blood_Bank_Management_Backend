import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { updateTestResults, processBloodComponents } from "../controllers/lab.controller.js";

const router = Router();
router.use(verifyJWT);

router.put("/test", updateTestResults);         // Input Lab Results
router.post("/process", processBloodComponents); // Split Blood

export default router;