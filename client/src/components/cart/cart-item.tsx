import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

interface CartItemProps {
  item: {
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
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleQuantityDecrease = async () => {
    if (item.quantity > 1) {
      setIsLoading(true);
      await updateQuantity(item.id, item.quantity - 1);
      setIsLoading(false);
    }
  };
  
  const handleQuantityIncrease = async () => {
    setIsLoading(true);
    await updateQuantity(item.id, item.quantity + 1);
    setIsLoading(false);
  };
  
  const handleRemove = async () => {
    setIsLoading(true);
    await removeItem(item.id);
    setIsLoading(false);
  };
  
  // Calculate item total
  const itemTotal = Number(item.product.price) * item.quantity;
  
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-0">
      {/* Product Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <Link href={`/product/${item.product.slug}`}>
          <img
            src={item.product.imageUrl || "https://placehold.co/100x100?text=No+Image"}
            alt={item.product.name}
            className="h-full w-full object-cover object-center"
          />
        </Link>
      </div>
      
      {/* Product Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link href={`/product/${item.product.slug}`}>
              <h3 className="text-base font-medium text-gray-900 hover:text-primary">
                {item.product.name}
              </h3>
            </Link>
            <p className="mt-1 text-sm text-gray-500 line-clamp-1">
              {item.product.shortDescription}
            </p>
          </div>
          <p className="text-right font-medium text-gray-900">
            {formatPrice(itemTotal)}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none text-gray-500"
              onClick={handleQuantityDecrease}
              disabled={isLoading || item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none text-gray-500"
              onClick={handleQuantityIncrease}
              disabled={isLoading}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Unit Price + Remove */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-500">
              {formatPrice(item.product.price)} за шт.
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500"
              onClick={handleRemove}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
