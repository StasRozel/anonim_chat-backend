import { Socket } from "socket.io";
import logger from "../utils/logger";
require("dotenv").config();

export function adminMiddleware(adminEvents: Set<string>) {
  return function (this: Socket, packet: any[], next: (err?: any) => void) {
    const eventName = packet && packet.length > 0 ? packet[0] : null;
    if (eventName && adminEvents.has(eventName)) {
      const user = this.data?.user as any;
      const superAdminId = process.env.SUPER_ADMIN_ID ? Number(process.env.SUPER_ADMIN_ID) : undefined;
      const allowed = !!(user && (user.is_admin || user.id === superAdminId));
      
      console.log("Admin middleware check:", {
        eventName,
        user: user ? { id: user.id, is_admin: user.is_admin } : null,
        superAdminId,
        allowed
      });
      
      if (!allowed) {
        logger.warn(
          { socketId: this.id, eventName, userId: user?.id },
          "Unauthorized event attempt (admin required)"
        );
        return next(new Error("Forbidden: admin only"));
      }
    }
    next();
  };
}

export function superAdminMiddleware(superAdminEvents: Set<string>) {
  return function (this: Socket, packet: any[], next: (err?: any) => void) {
    const eventName = packet && packet.length > 0 ? packet[0] : null;
    if (eventName && superAdminEvents.has(eventName)) {
      const user = this.data?.user as any;
      const superAdminId = process.env.SUPER_ADMIN_ID ? Number(process.env.SUPER_ADMIN_ID) : undefined;
      const allowed = !!(user && user.id === superAdminId);
      
      console.log("Super admin middleware check:", {
        eventName,
        user: user ? { id: user.id, is_admin: user.is_admin } : null,
        superAdminId,
        allowed
      });
      
      if (!allowed) {
        logger.warn(
          { socketId: this.id, eventName, userId: user?.id },
          "Unauthorized event attempt (super admin required)"
        );
        return next(new Error("Forbidden: super admin only"));
      }
    }
    next();
  };
}