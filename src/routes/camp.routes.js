import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createCamp, getCamps } from "../controllers/camp.controller.js";

const router = Router();
router.use(verifyJWT);

router.post("/create", createCamp);
router.get("/", getCamps);

export default router;