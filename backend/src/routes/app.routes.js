import { Router } from "express";
import { bootstrap } from "../controllers/app.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = Router();

router.get("/bootstrap", requireAuth, bootstrap);

export default router;