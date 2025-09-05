import { userController } from "../controllers/user.controller";
import { Router } from "express";

const router = Router();

router.get("/users", userController.getUsers);

export default router;