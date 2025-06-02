import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get API base URL from environment or default to current origin
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In development, use localhost:5000
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // In production, use same origin
  return window.location.origin;
};

const API_BASE_URL = getApiBaseUrl();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    } catch (error) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("token");
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const token = localStorage.getItem("token");
      const url = queryKey[0] as string;
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      
      const res = await fetch(fullUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      return data;
    } catch (error) {
      // Silent handling for 401 errors when configured to return null
      if (unauthorizedBehavior === "returnNull" && error instanceof Error && error.message.includes('401')) {
        return null;
      }
      console.error('Query error:', error);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

// Global error handling for queries
const globalErrorHandler = (error: any) => {
  // Silently handle 401 errors and network issues
  if (error?.message?.includes('401') || 
      error?.message?.includes('Unauthorized') ||
      error?.message?.includes('fetch')) {
    return;
  }
  console.error('Query error:', error);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      throwOnError: false,
      refetchOnMount: false,
      onError: globalErrorHandler,
    },
    mutations: {
      retry: false,
      throwOnError: false,
      onError: globalErrorHandler,
    },
  },
});
