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
    <Card className="overflow-hidden shadow-sm hover:shadow-lg hover:translate-y-[-4px] transition-all duration-300 ease-in-out group h-full animate-fadeIn">
      <div className="relative">
        <Link href={`/product/${product.slug}`}>
          <div className="overflow-hidden relative">
            <img 
              src={product.imageUrl || "https://placehold.co/400x300?text=No+Image"} 
              alt={product.name}
              className="w-full h-56 object-cover transform transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <div className="p-4 text-white w-full">
                <p className="text-sm font-medium transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">Подробнее</p>
              </div>
            </div>
          </div>
        </Link>
        
        <div className="absolute top-2 right-2 transition-transform duration-300 transform group-hover:translate-y-1 group-hover:translate-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-primary transition-all duration-300 hover:shadow-lg hover:scale-110"
                  onClick={toggleWishlist}
                >
                  <Heart className={`h-4 w-4 transition-all duration-300 ${isWishlisted ? 'fill-primary text-primary scale-110' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="animate-in zoom-in-75 duration-200">
                <p>{isWishlisted ? 'Удалить из избранного' : 'Добавить в избранное'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {product.tag && (
          <div className="absolute top-2 left-2 transform transition-transform duration-300 group-hover:scale-110">
            <span className={`text-white text-xs font-bold px-2 py-1 rounded-md shadow-md ${
              product.tag === 'Best Seller' || product.tag === 'Хит продаж' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
              product.tag === 'New' || product.tag === 'Новинка' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 
              product.tag === 'Sale' || product.tag === 'Скидка' ? 'bg-gradient-to-r from-rose-500 to-red-500' : 
              'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}>
              {product.tag === 'Best Seller' ? 'Хит продаж' : 
               product.tag === 'New' ? 'Новинка' : 
               product.tag === 'Sale' ? 'Скидка' : 
               product.tag}
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 transition-all duration-300 group-hover:bg-gray-50/50">
        <div className="flex justify-between items-start mb-1">
          <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-gray-600">
            {/* Category would normally be fetched by joining with categories table */}
            Категория
          </p>
          
          {product.rating && (
            <div className="flex items-center transition-transform duration-300 transform group-hover:scale-105">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-sm ml-1 text-gray-700">{product.rating}</span>
              <span className="text-xs ml-1 text-gray-500">({product.reviewCount || 0})</span>
            </div>
          )}
        </div>
        
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-gray-900 hover:text-primary transition duration-200 mb-1 relative inline-block">
            {product.name}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 h-10 overflow-hidden mb-3 transition-colors duration-300 group-hover:text-gray-600">
          {product.shortDescription || product.description?.substring(0, 80) || ""}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="transition-transform duration-300 transform group-hover:translate-y-[-2px]">
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
            className="bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md"
            onClick={handleAddToCart}
            disabled={isLoading || !product.stock || product.stock === 0}
          >
            <ShoppingCart className={`h-4 w-4 mr-1 transition-all duration-300 ${isLoading ? 'animate-spin' : 'group-hover:animate-bounce'}`} />
            {isLoading ? 'Добавляем...' : 'В корзину'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
