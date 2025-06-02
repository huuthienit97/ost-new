import { Request, Response, NextFunction } from "express";
import { authenticateApiKey, ApiKeyRequest } from "./apiKeyAuth";
import { authenticate, AuthenticatedRequest } from "./auth";

export interface FlexibleAuthRequest extends Request {
  user?: any;
  apiKey?: any;
  authType?: 'jwt' | 'apikey' | 'same-origin';
}

// Simplified middleware that allows public access from same origin, requires API key for external
export function flexibleAuth(req: FlexibleAuthRequest, res: Response, next: NextFunction) {
  try {
    // Check if request has API key header
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey) {
      // Has API key - use API key authentication
      req.authType = 'apikey';
      return authenticateApiKey(req as ApiKeyRequest, res, next);
    } else {
      // No API key - allow same-origin access, require API key for external
      const origin = req.headers.origin;
      const host = req.headers.host;
      
      // Simple same-origin check
      const isSameOrigin = !origin || origin === `http://${host}` || origin === `https://${host}`;
      
      if (isSameOrigin) {
        // Same origin - allow public access
        req.authType = 'same-origin';
        return next();
      } else {
        // External origin without API key
        return res.status(401).json({ message: "API key required for external access" });
      }
    }
  } catch (error) {
    console.error('FlexibleAuth error:', error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

// Middleware to require specific permissions for flexible auth
export function requireFlexiblePermission(permission: string) {
  return (req: FlexibleAuthRequest, res: Response, next: NextFunction) => {
    if (req.authType === 'same-origin') {
      // Same origin access - allow
      return next();
    }
    
    if (req.authType === 'jwt' && req.user) {
      // JWT authentication - check user permissions
      const userPermissions = req.user.role?.permissions || [];
      if (userPermissions.includes(permission) || userPermissions.includes('system:admin')) {
        return next();
      }
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    
    if (req.authType === 'apikey' && req.apiKey) {
      // API key authentication - check API key permissions
      if (!req.apiKey.permissions.includes(permission)) {
        return res.status(403).json({ 
          error: "Insufficient permissions",
          message: `Permission '${permission}' required but not granted to this API key`,
          requiredPermission: permission,
          grantedPermissions: req.apiKey.permissions
        });
      }
      return next();
    }
    
    return res.status(401).json({ message: "Authentication required" });
  };
}