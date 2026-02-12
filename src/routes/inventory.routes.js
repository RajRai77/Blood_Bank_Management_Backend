import { Router } from "express";
import { addInventory, getInventoryStats, getRecentInventory, getCertificate, deleteInventoryItem, getInventory,} from "../controllers/inventory.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Ensure you have this

const router = Router();

// Apply Security to all routes
router.use(verifyJWT);


// Routes
// --- MAIN ROUTE ---
router.route("/").get(getInventory);


router.route("/add").post(addInventory);       // Add blood
router.route("/stats").get(getInventoryStats); // For Dashboard Cards
router.route("/recent").get(getRecentInventory); // For Activity Log
router.route("/certificate/:donorId").get(getCertificate);
router.route("/:id").delete(deleteInventoryItem);

export default router;