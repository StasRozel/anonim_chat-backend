import { Request, Response } from "express";
import logger from "../utils/logger";
import { userRepository } from "../repositories/user.repository";

class UserController {
    async getUsers(req: Request, res: Response) {
        try {
            const users = await userRepository.getUsers();
           
            if (!users) {
                res.status(404).json({ error: "Users not found", count: 0 });
                return;
            }
            res.status(200).json({ ...users });
        } catch (error: any) {
            logger.error("Get users error:", error);
            res.status(500).json({ error: "Get users failed" });
        }
    }
}

export const userController = new UserController();