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
    window.location.href = "/login";
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