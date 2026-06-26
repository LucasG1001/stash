import { Router } from "express";
import { exportAll, exportDump, importAll } from "../controllers/backupController.js";

const router = Router();

router.get("/export", exportAll);
router.get("/export/dump", exportDump);
router.post("/import", importAll);

export { router as backupRoutes };
