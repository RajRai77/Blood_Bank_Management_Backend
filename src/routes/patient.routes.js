import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addPatient, getPatients, dispenseBlood } from "../controllers/patient.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/")
    .get(getPatients)
    .post(addPatient);

router.route("/:id/dispense").post(dispenseBlood);

export default router;