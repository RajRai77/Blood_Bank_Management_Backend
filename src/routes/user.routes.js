import { Router } from "express";
import { loginUser, logoutUser, registerUser, getHospitals , getCurrentUser} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"; // <--- Make sure this path is correct

const router = Router();

router.route("/register").post(registerUser); // New Route
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/hospitals").get(getHospitals); // New Route
router.route("/current-user").get(verifyJWT, getCurrentUser); // <--- THIS WAS MISSING
export default router;