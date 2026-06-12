import { Router } from "express";
import { getByGenre, search, getById, proxyMedia } from "../controllers/bookController.js";

const router = Router();

router.get("/genre", getByGenre);
router.get("/search", search);
router.get("/media", proxyMedia);
router.get("/:id", getById);

export { router as bookRoutes };
