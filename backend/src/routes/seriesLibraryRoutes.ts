import { Router } from "express";
import { getAll, create, update, updateManyStatus, remove, removeMany } from "../controllers/seriesLibraryController.js";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.post("/bulk-delete", removeMany);
router.post("/bulk-update-status", updateManyStatus);
router.put("/:id", update);
router.delete("/:id", remove);

export { router as seriesLibraryRoutes };
