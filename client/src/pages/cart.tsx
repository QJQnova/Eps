import { useState } from "react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  ArrowLeft, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Shield 
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { Separator } from "@/components/ui/separator";
import CartItem from "@/components/cart/cart-item";

export default function Cart() {
  const { items, subtotal, itemCount, clearCart, isLoading } = useCart();
  const [isClearingCart, setIsClearingCart] = useState(false);
  
  const handleClearCart = async () => {
    setIsClearingCart(true);
    await clearCart();
    setIsClearingCart(false);
  };
  
  // Calculate tax and shipping
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 75 ? 0 : 10; // Free shipping over $75
  const total = subtotal + tax + shipping;
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading your cart...</h2>
          <p className="text-gray-500">Please wait while we fetch your cart information.</p>
        </div>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any products to your cart yet.</p>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-medium flex justify-between items-center">
                <span>Cart Items ({itemCount})</span>
                <Button 
                  variant="ghost" 
                  className="text-gray-500 text-sm font-normal"
                  onClick={handleClearCart}
                  disabled={isClearingCart}
                >
                  Clear Cart
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-medium">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium text-lg">Total</span>
                <span className="font-bold text-lg">${total.toFixed(2)}</span>
              </div>
              
              <Button className="w-full mt-6">
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Checkout
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 text-sm text-gray-500">
              <div className="flex items-center">
                <Truck className="h-4 w-4 mr-2 text-primary" />
                <span>Free shipping on orders over $75</span>
              </div>
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
                <span>30-day easy returns</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                <span>Secure payment processing</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
