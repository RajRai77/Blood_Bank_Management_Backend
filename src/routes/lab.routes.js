import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getUntestedUnits, 
    getSafeUnits, 
    updateTestResults, 
    processComponents 
} from "../controllers/lab.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/untested").get(getUntestedUnits);   // Tab 1
router.route("/safe").get(getSafeUnits);           // Tab 2
router.route("/update-results").post(updateTestResults); // Modal 1 Action
router.route("/process").post(processComponents);        // Modal 2 Action

export default router;