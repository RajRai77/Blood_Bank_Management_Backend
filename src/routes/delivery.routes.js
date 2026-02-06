import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { assignDriver, updateLocation, completeDelivery } from "../controllers/delivery.controller.js";

const router = Router();
router.use(verifyJWT);

router.post("/assign", assignDriver);        // Admin assigns driver
router.put("/:deliveryId/location", updateLocation); // Driver updates GPS
router.put("/:deliveryId/complete", completeDelivery); // Nurse signs

export default router;