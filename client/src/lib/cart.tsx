import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Browser-compatible UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Types
type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    shortDescription?: string;
    slug: string;
  };
};

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  cartId: string;
  isLoading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string>("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  
  // Initialize cart ID from localStorage or create new one
  useEffect(() => {
    let storedCartId = localStorage.getItem("cartId");
    
    if (!storedCartId) {
      storedCartId = generateUUID();
      localStorage.setItem("cartId", storedCartId);
    }
    
    setCartId(storedCartId || "");
  }, []);
  
  // Fetch cart data when cartId is available
  useEffect(() => {
    if (cartId) {
      fetchCart();
    }
  }, [cartId]);
  
  // Fetch cart data from API
  const fetchCart = async () => {
    if (!cartId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cart/${cartId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setItemCount(data.itemCount);
        setSubtotal(data.subtotal);
      }
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add item to cart
  const addToCart = async (productId: number, quantity = 1) => {
    if (!cartId) return;
    
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/cart/items", {
        cartId,
        productId,
        quantity
      });
      
      await fetchCart();
      
      toast({
        title: "Added to cart",
        description: "The item has been added to your cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update item quantity
  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!cartId) return;
    
    setIsLoading(true);
    try {
      await apiRequest("PATCH", `/api/cart/items/${itemId}`, { quantity });
      await fetchCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item quantity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove item from cart
  const removeItem = async (itemId: number) => {
    if (!cartId) return;
    
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/cart/items/${itemId}`);
      await fetchCart();
      
      toast({
        title: "Item removed",
        description: "The item has been removed from your cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear cart
  const clearCart = async () => {
    if (!cartId) return;
    
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/cart/${cartId}`);
      await fetchCart();
      
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    items,
    itemCount,
    subtotal,
    cartId,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook for using the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
