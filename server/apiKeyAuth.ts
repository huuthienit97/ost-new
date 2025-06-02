import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { apiKeys } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: number;
    name: string;
    permissions: string[];
    rateLimit: number;
  } | null | undefined;
}

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<number, { count: number; resetTime: number }>();

export async function authenticateApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  try {
    // Skip API key authentication for same-origin requests (frontend calling backend)
    const origin = req.headers.origin;
    const host = req.headers.host;
    const referer = req.headers.referer;
    
    // Check if request is from same origin (frontend to backend)
    const isSameOrigin = origin && host && (
      origin === `http://${host}` || 
      origin === `https://${host}` ||
      (referer && (referer.startsWith(`http://${host}`) || referer.startsWith(`https://${host}`)))
    );
    
    if (isSameOrigin) {
      req.apiKey = null;
      return next();
    }

    const apiKeyHeader = req.headers['x-api-key'] as string;
    
    if (!apiKeyHeader) {
      return res.status(401).json({ 
        error: "API key required",
        message: "Provide API key in X-API-Key header" 
      });
    }

    // Hash the provided API key
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');
    
    // Find API key in database
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true)
      ));

    if (!apiKey) {
      return res.status(401).json({ 
        error: "Invalid API key",
        message: "API key not found or inactive" 
      });
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return res.status(401).json({ 
        error: "API key expired",
        message: "API key has expired" 
      });
    }

    // Rate limiting check
    const now = Date.now();
    const hourWindow = 60 * 60 * 1000; // 1 hour
    const rateLimitData = rateLimitStore.get(apiKey.id);
    
    if (rateLimitData) {
      if (now > rateLimitData.resetTime) {
        // Reset window
        rateLimitStore.set(apiKey.id, { count: 1, resetTime: now + hourWindow });
      } else {
        if (rateLimitData.count >= apiKey.rateLimit) {
          return res.status(429).json({ 
            error: "Rate limit exceeded",
            message: `Rate limit of ${apiKey.rateLimit} requests per hour exceeded`,
            resetTime: new Date(rateLimitData.resetTime).toISOString()
          });
        }
        rateLimitData.count++;
      }
    } else {
      rateLimitStore.set(apiKey.id, { count: 1, resetTime: now + hourWindow });
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    // Attach API key info to request
    req.apiKey = {
      id: apiKey.id,
      name: apiKey.name,
      permissions: Array.isArray(apiKey.permissions) ? apiKey.permissions : [],
      rateLimit: apiKey.rateLimit,
    };

    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(500).json({ 
      error: "Authentication error",
      message: "Internal server error during API key validation" 
    });
  }
}

export function requireApiPermission(permission: string) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    // Skip permission check for same-origin requests (already authenticated via same-origin check)
    if (req.apiKey === null) {
      return next();
    }

    if (!req.apiKey) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "API key authentication required" 
      });
    }

    if (!req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        message: `Permission '${permission}' required but not granted to this API key`,
        requiredPermission: permission,
        grantedPermissions: req.apiKey.permissions
      });
    }

    next();
  };
}