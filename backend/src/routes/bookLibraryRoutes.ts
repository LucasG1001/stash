import { Router } from "express";
import { getAll, create, update, remove, removeMany } from "../controllers/bookLibraryController.js";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.post("/bulk-delete", removeMany);
router.put("/:id", update);
router.delete("/:id", remove);

export { router as bookLibraryRoutes };
