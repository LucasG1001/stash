import { Router } from "express";
import { getPopular, getUpcoming, search, getById } from "../controllers/gameController.js";

const router = Router();

router.get("/popular", getPopular);
router.get("/upcoming", getUpcoming);
router.get("/search", search);
router.get("/:id", getById);

export { router as gameRoutes };
