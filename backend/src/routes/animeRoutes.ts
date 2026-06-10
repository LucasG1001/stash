import { Router } from "express";
import { getCurrentSeason, getNextSeason, getPopular, search, getById } from "../controllers/animeController.js";

const router = Router();

router.get("/season/current", getCurrentSeason);
router.get("/season/next", getNextSeason);
router.get("/popular", getPopular);
router.get("/search", search);
router.get("/:id", getById);

export { router as animeRoutes };
