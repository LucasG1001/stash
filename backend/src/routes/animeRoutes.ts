import { Router } from "express";
import { getSeason, getPopular, search, getById } from "../controllers/animeController.js";

const router = Router();

router.get("/season", getSeason);
router.get("/popular", getPopular);
router.get("/search", search);
router.get("/:id", getById);

export { router as animeRoutes };
