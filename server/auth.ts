import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { PERMISSIONS } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 10;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    roleId: number;
    permissions: string[];
  };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: any, permissions: string[]): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      permissions,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Token đã hết hạn" });
    }

    // Get fresh user data to ensure permissions are up to date
    const user = await storage.getUserWithRole(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Tài khoản không tồn tại hoặc đã bị khóa" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      permissions: user.role.permissions,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Xác thực thất bại" });
  }
}

// Authorization middleware
export function authorize(requiredPermissions: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Chưa đăng nhập" });
    }

    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const userPermissions = req.user.permissions || [];

    // Super admin has all permissions
    if (userPermissions.includes(PERMISSIONS.SYSTEM_ADMIN)) {
      return next();
    }

    // Check if user has at least one of the required permissions
    const hasPermission = permissions.some(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      return res.status(403).json({ message: "Không có quyền thực hiện hành động này" });
    }

    next();
  };
}

// Optional authentication (for routes that work with or without auth)
export async function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded) {
      const user = await storage.getUserWithRole(decoded.id);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          roleId: user.roleId,
          permissions: user.role.permissions,
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
}