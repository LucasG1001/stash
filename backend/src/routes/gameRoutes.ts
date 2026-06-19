import { Router } from "express";
import { getPopular, getUpcoming, search, getById, proxyImage } from "../controllers/gameController.js";

const router = Router();

router.get("/popular", getPopular);
router.get("/upcoming", getUpcoming);
router.get("/search", search);
router.get("/image/:size/:file", proxyImage);
router.get("/:id", getById);

export { router as gameRoutes };
