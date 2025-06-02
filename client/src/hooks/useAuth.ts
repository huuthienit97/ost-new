import { useQuery } from "@tanstack/react-query";
import { User, Role, PERMISSIONS } from "@shared/schema";

interface UserWithRole extends User {
  role: Role;
}

export function useAuth() {
  const token = localStorage.getItem("token");
  
  const { data: user, isLoading, error } = useQuery<{ user: UserWithRole } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    throwOnError: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!token,
  });

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