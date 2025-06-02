import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: {
    id: number;
    name: string;
    displayName: string;
    permissions: string[];
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        // Verify token with server
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAuthState({
            user: data.user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        // Network error or server down
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const hasPermission = (permission: string): boolean => {
    if (!authState.user || !authState.user.role) return false;
    return authState.user.role.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!authState.user || !authState.user.role) return false;
    return permissions.some(permission => authState.user!.role.permissions.includes(permission));
  };

  return {
    ...authState,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
  };
}