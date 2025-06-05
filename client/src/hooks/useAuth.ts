import { useQuery } from "@tanstack/react-query";
import { User, Role, PERMISSIONS } from "@shared/schema";

interface UserWithRole extends User {
  role: Role;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<{ user: UserWithRole }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logout = () => {
    localStorage.removeItem("token");
    // Force reload to clear all state and redirect to login
    window.location.reload();
  };

  const hasPermission = (requiredRole: string): boolean => {
    if (!user?.user?.role?.permissions) return false;
    
    const userRole = user.user.role.permissions[0]; // Single role system
    
    // Role hierarchy: admin > manager > member
    const roleHierarchy: { [key: string]: string[] } = {
      'admin': ['admin', 'manager', 'member'],
      'manager': ['manager', 'member'],
      'member': ['member']
    };
    
    const allowedRoles = roleHierarchy[userRole] || [];
    return allowedRoles.includes(requiredRole);
  };

  return {
    user: user?.user,
    isLoading,
    isAuthenticated: !!user?.user,
    logout,
    hasPermission,
  };
}