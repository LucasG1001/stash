import { Router } from "express";
import { getPopular, getNowPlaying, search, getById } from "../controllers/movieController.js";

const router = Router();

router.get("/popular", getPopular);
router.get("/now-playing", getNowPlaying);
router.get("/search", search);
router.get("/:id", getById);

export { router as movieRoutes };
