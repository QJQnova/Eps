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
  const [imageError, setImageError] = useState(false);
  const { addToCart, isLoading } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product.id);
  };
  
  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };
  
  // Безопасное форматирование цены с проверкой на null/undefined
  const formatPrice = (price: string | number | null | undefined) => {
    if (price == null) return "0 ₽";
    return Number(price).toLocaleString('ru-RU') + " ₽";
  };
  
  return (
    <Card className="product-card group h-full flex flex-col bg-white border-0">
      <div className="relative overflow-hidden">
        <Link href={`/product/${product.slug}`}>
          <div className="bg-gray-50 pt-6 px-6 pb-4 flex items-center justify-center">
            <img 
              src={imageError || !product.imageUrl ? "/placeholder-product.svg" : product.imageUrl} 
              alt={product.name}
              className="w-full h-48 object-contain product-image"
              onError={() => setImageError(true)}
            />
          </div>
        </Link>
        
        <div className="absolute top-3 right-3 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-white/90 shadow-sm text-gray-500 hover:text-eps-red h-8 w-8 rounded-full action-button"
                  onClick={toggleWishlist}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-eps-red text-eps-red' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isWishlisted ? 'Удалить из избранного' : 'Добавить в избранное'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Бейджи для тегов и скидок */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.tag && (
            <div className="inline-block">
              <span className={`text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-sm ${
                product.tag === 'Best Seller' || product.tag === 'Хит продаж' ? 'bg-eps-yellow' : 
                product.tag === 'New' || product.tag === 'Новинка' ? 'bg-eps-red' : 
                product.tag === 'Sale' || product.tag === 'Скидка' ? 'bg-eps-red' : 
                'bg-eps-yellow'
              }`}>
                {product.tag === 'Best Seller' ? 'Хит продаж' : 
                 product.tag === 'New' ? 'Новинка' : 
                 product.tag === 'Sale' ? 'Скидка' : 
                 product.tag}
              </span>
            </div>
          )}
          
          {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
            <div className="inline-block">
              <span className="bg-eps-red text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-sm">
                -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-5 flex flex-col flex-grow">
        {/* Отзывы и рейтинг */}
        <div className="mb-2 flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={`h-4 w-4 ${i < (Number(product.rating) || 0) ? 'fill-eps-yellow text-eps-yellow' : 'text-gray-200'}`} 
            />
          ))}
          <span className="text-xs text-gray-500 ml-1.5">{product.rating || 0}</span>
          {product.reviewCount && <span className="text-xs text-gray-500">({product.reviewCount})</span>}
        </div>
        
        {/* Название товара */}
        <Link href={`/product/${product.slug}`} className="group">
          <h3 className="font-medium text-base sm:text-lg mb-1.5 line-clamp-2 group-hover:text-eps-red transition-colors duration-300">
            {product.name}
          </h3>
        </Link>
        
        {/* Короткое описание */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
          {product.shortDescription || (product.description ? product.description.substring(0, 80) : "")}
        </p>
        
        {/* Цена и кнопка добавления в корзину */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="text-sm line-through text-gray-500">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="font-bold text-lg text-eps-red">{formatPrice(product.price)}</span>
          </div>
          
          <Button 
            className="bg-eps-gradient hover:from-eps-red hover:to-eps-yellow text-white action-button shadow-sm"
            onClick={handleAddToCart}
            disabled={isLoading || !product.stock || product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            В корзину
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
