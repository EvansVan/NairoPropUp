import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceSnapshot: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    category: string;
  };
}
export interface Cart {
  id: string;
  userId: string | null;
  cartToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: CartItem[];
}

function getCartToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cartToken");
}

function setCartToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("cartToken", token);
  } else {
    localStorage.removeItem("cartToken");
  }
}

export function useCart() {
  const queryClient = useQueryClient();
  const cartToken = getCartToken();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (cartToken) {
        headers["x-cart-token"] = cartToken;
      }
      const res = await fetch("/api/cart", {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      // Store cartToken if returned
      if (data.cartToken && !cartToken) {
        setCartToken(data.cartToken);
      }
      return data;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (cartToken) {
        headers["x-cart-token"] = cartToken;
      }
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      const data = await res.json();
      // Store cartToken if returned
      if (data.cartToken && !cartToken) {
        setCartToken(data.cartToken);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (cartToken) {
        headers["x-cart-token"] = cartToken;
      }
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to update item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const headers: Record<string, string> = {};
      if (cartToken) {
        headers["x-cart-token"] = cartToken;
      }
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  return {
    cart,
    isLoading,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    isAdding: addItemMutation.isPending,
  };
}
