import { Router } from "express";
import { raizPost, getAttendance, patchEvent } from "../controllers/events.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = Router();

// POST /events para crear un nuevo evento con asistencias
router.post("/", requireAuth, raizPost);

// GET /events/:eventId/attendance para obtener las asistencias de un evento específico 
router.get("/:eventId/attendance",requireAuth ,getAttendance);

// PATCH /event/:eventId
router.patch("/:eventId", requireAuth, patchEvent);

export default router;