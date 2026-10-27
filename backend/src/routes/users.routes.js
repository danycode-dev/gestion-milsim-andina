import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { memberPost, patchMember } from "../controllers/members.controller.js";
import { changePasswordController, userDeactivateController, userGetByIdController, userPatchController, userPostController, usersGetController } from "../controllers/users.controller.js";

const router = Router();

// POST /users para crear un nuevo user
router.post("/", requireAuth, userPostController);

// GET /users
router.get("/", requireAuth, usersGetController);

// GET /users/:memberId   # para obtener un usario especifico
router.get("/:userId", requireAuth, userGetByIdController);

//PATCH /users/me/password 
router.patch("/me/password", requireAuth, changePasswordController)

router.patch("/:userId", requireAuth, userPatchController)

router.delete("/:userId", requireAuth, userDeactivateController)


// PATCH /event/:eventId   # para editar un usario
//router.patch("/:memberId", requireAuth, patchMember);

export default router;