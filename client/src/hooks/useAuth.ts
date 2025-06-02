import { useQuery } from "@tanstack/react-query";
import { User, Role, PERMISSIONS } from "@shared/schema";

interface UserWithRole extends User {
  role: Role;
}

export function useAuth() {
  // Temporarily disable auth query to test if this is causing the issue
  const user = null;
  const isLoading = false;
  const error = null;

  const logout = () => {
    localStorage.removeItem("token");
    // Force reload to clear all state and redirect to login
    window.location.reload();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.user?.role?.permissions) return false;
    return user.user.role.permissions.includes(permission) || 
           user.user.role.permissions.includes(PERMISSIONS.SYSTEM_ADMIN);
  };

  return {
    user: user?.user,
    isLoading,
    isAuthenticated: !!user?.user,
    logout,
    hasPermission,
  };
}