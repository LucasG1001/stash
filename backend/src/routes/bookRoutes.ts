import { Router } from "express";
import { getByGenre, search, getById } from "../controllers/bookController.js";

const router = Router();

router.get("/genre", getByGenre);
router.get("/search", search);
router.get("/:id", getById);

export { router as bookRoutes };
