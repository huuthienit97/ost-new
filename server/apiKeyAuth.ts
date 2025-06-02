import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { apiKeys } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: number;
    name: string;
    permissions: string[];
  };
}

export async function apiKeyAuth(req: ApiKeyRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ message: "API key is required" });
    }

    // Find API key in database by comparing hashes
    const allKeys = await db.select().from(apiKeys);
    let keyRecord = null;
    
    for (const key of allKeys) {
      if (await bcrypt.compare(apiKey, key.keyHash)) {
        keyRecord = key;
        break;
      }
    }

    if (!keyRecord || !keyRecord.isActive) {
      return res.status(401).json({ message: "Invalid or inactive API key" });
    }

    // Check expiry
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      return res.status(401).json({ message: "API key has expired" });
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, keyRecord.id));

    // Attach API key info to request
    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      permissions: keyRecord.permissions,
    };

    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

export function requireApiPermission(permission: string | string[]) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ message: "API key authentication required" });
    }

    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = requiredPermissions.some(perm => 
      req.apiKey!.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: "Insufficient permissions", 
        required: requiredPermissions,
        available: req.apiKey.permissions 
      });
    }

    next();
  };
}

// Combined middleware that accepts either JWT token or API key
export async function flexibleAuth(req: any, res: Response, next: NextFunction) {
  // Check for API key first
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    return apiKeyAuth(req, res, next);
  }

  // Fall back to JWT authentication
  const { authenticate } = await import("./auth");
  return authenticate(req, res, next);
}