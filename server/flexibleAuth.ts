import { Request, Response, NextFunction } from "express";
import { authenticateApiKey, ApiKeyRequest } from "./apiKeyAuth";
import { authenticate, AuthenticatedRequest } from "./auth";

export interface FlexibleAuthRequest extends Request {
  user?: any;
  apiKey?: any;
  authType?: 'jwt' | 'apikey' | 'same-origin';
}

// Middleware that allows both JWT authentication (same-origin) and API key authentication (external)
export function flexibleAuth(req: FlexibleAuthRequest, res: Response, next: NextFunction) {
  // Check if request is from same origin (frontend to backend)
  const origin = req.headers.origin;
  const host = req.headers.host;
  const referer = req.headers.referer;
  
  const isSameOrigin = origin && host && (
    origin === `http://${host}` || 
    origin === `https://${host}` ||
    (referer && (referer.startsWith(`http://${host}`) || referer.startsWith(`https://${host}`)))
  );
  
  if (isSameOrigin) {
    // Same origin - use JWT authentication or allow public access
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // Has JWT token - authenticate normally
      req.authType = 'jwt';
      return authenticate(req as AuthenticatedRequest, res, next);
    } else {
      // No token but same origin - allow public access
      req.authType = 'same-origin';
      return next();
    }
  } else {
    // External origin - require API key
    req.authType = 'apikey';
    return authenticateApiKey(req as ApiKeyRequest, res, next);
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