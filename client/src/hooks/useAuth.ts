import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  username: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const mergeCartAfterAuth = async () => {
    const cartToken = localStorage.getItem("cartToken");
    if (cartToken) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "x-cart-token": cartToken,
        };
        const res = await fetch("/api/cart/merge", {
          method: "POST",
          headers,
          credentials: "include",
        });
        if (res.ok) {
          // Clear guest cart token
          localStorage.removeItem("cartToken");
          // Invalidate cart query to fetch merged cart
          queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        }
      } catch (error) {
        console.error("Failed to merge cart:", error);
      }
    }
  };

  const loginMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      apiRequest("POST", "/api/login", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      await mergeCartAfterAuth();
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      apiRequest("POST", "/api/register", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      await mergeCartAfterAuth();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/logout"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/profile"] }),
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
