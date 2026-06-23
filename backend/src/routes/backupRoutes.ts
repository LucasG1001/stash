import { Router } from "express";
import { exportAll, importAll } from "../controllers/backupController.js";

const router = Router();

router.get("/export", exportAll);
router.post("/import", importAll);

export { router as backupRoutes };
