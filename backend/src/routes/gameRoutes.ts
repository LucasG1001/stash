import { Router } from "express";
import { getPopular, getUpcoming, search, getById, proxyMedia } from "../controllers/gameController.js";

const router = Router();

router.get("/popular", getPopular);
router.get("/upcoming", getUpcoming);
router.get("/search", search);
router.get("/media", proxyMedia);
router.get("/:id", getById);

export { router as gameRoutes };
