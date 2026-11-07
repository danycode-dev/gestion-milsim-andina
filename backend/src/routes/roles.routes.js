import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import { roleDeleteController, rolePatchController, rolePostController } from "../controllers/roles.controller.js";



const router = Router();


router.post("/",requireAuth,  rolePostController);
router.patch("/:id",requireAuth, rolePatchController);
router.delete("/:id",requireAuth, roleDeleteController);

export default router;




