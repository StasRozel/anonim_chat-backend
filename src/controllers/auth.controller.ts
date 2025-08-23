import { Request, Response } from "express";
import logger from "../utils/logger";
import { authRepository } from "../repositories/auth.repository";

class AuthController {
    async register(req: Request, res: Response) { 
        const { user } = req.body;
        try {
            const registeredUser = await authRepository.register(user);
            res.status(201).json(registeredUser);
        } catch (error: any) {
            logger.error("Registration error:", error);
            res.status(500).json({ error: "Registration failed" });
        }
     }

    async login(req: Request, res: Response) {
        const { user } = req.body;
        try {
            logger.debug('Logging user: ', user);
            const loggedInUser = await authRepository.login(user);
           
            if (!loggedInUser) {
                res.status(404).json({ error: "User not found", result: false });
                return;
            }
            res.status(200).json({ ...loggedInUser, result: true });
        } catch (error: any) {
            logger.error("Login error:", error);
            res.status(500).json({ error: "Login failed" });
        }
    }
}

export const authController = new AuthController();