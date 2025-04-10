import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart, isLoading } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product.id);
  };
  
  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };
  
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition duration-200 group h-full">
      <div className="relative">
        <Link href={`/product/${product.slug}`}>
          <img 
            src={product.imageUrl || "https://placehold.co/400x300?text=No+Image"} 
            alt={product.name}
            className="w-full h-56 object-cover"
          />
        </Link>
        
        <div className="absolute top-2 right-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-gray-500 hover:text-primary transition duration-200"
                  onClick={toggleWishlist}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-primary text-primary' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isWishlisted ? 'Удалить из избранного' : 'Добавить в избранное'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {product.tag && (
          <div className="absolute top-2 left-2">
            <span className={`text-white text-xs font-bold px-2 py-1 rounded ${
              product.tag === 'Best Seller' || product.tag === 'Хит продаж' ? 'bg-amber-500' : 
              product.tag === 'New' || product.tag === 'Новинка' ? 'bg-emerald-500' : 
              product.tag === 'Sale' || product.tag === 'Скидка' ? 'bg-rose-500' : 
              'bg-blue-500'
            }`}>
              {product.tag === 'Best Seller' ? 'Хит продаж' : 
               product.tag === 'New' ? 'Новинка' : 
               product.tag === 'Sale' ? 'Скидка' : 
               product.tag}
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-1">
          <p className="text-sm text-gray-500">
            {/* Category would normally be fetched by joining with categories table */}
            Категория
          </p>
          
          {product.rating && (
            <div className="flex items-center">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-sm ml-1 text-gray-700">{product.rating}</span>
              <span className="text-xs ml-1 text-gray-500">({product.reviewCount})</span>
            </div>
          )}
        </div>
        
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-900 hover:text-primary transition duration-200 mb-1">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 h-10 overflow-hidden mb-3">
          {product.shortDescription || product.description?.substring(0, 80) || ""}
        </p>
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-medium text-gray-900">{Number(product.price).toLocaleString('ru-RU')} ₽</span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="text-sm line-through text-gray-500 ml-2">
                {Number(product.originalPrice).toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white rounded-lg transition duration-200"
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            В корзину
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
