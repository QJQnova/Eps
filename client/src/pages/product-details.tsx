import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { Home, ChevronRight, ShoppingCart, MinusCircle, PlusCircle, Star, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import ProductCard from "@/components/product/product-card";
import { Product, Category } from "@shared/schema";

export default function ProductDetails() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const { toast } = useToast();

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
  });

  // Fetch categories for breadcrumbs
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"]
  });
  
  // Fetch related products based on category
  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: [`/api/categories/${product?.categoryId}/products`],
    enabled: !!product?.categoryId,
  });

  const categoryName = product?.categoryId 
    ? categories.find(cat => cat.id === product.categoryId)?.name 
    : '';

  const handleQuantityChange = (value: string) => {
    setQuantity(parseInt(value, 10));
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-lg" />
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-8 w-1/4 mb-6" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-4/5 mb-6" />
            <div className="flex space-x-3 mb-6">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Товар не найден</h2>
        <p className="text-gray-500 mb-6">Товар, который вы ищете, не существует или был удален.</p>
        <Button asChild>
          <Link href="/">Вернуться на главную</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-1" />
              Главная
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/category/${categories.find(cat => cat.id === product.categoryId)?.slug || ''}`}>
              {categoryName}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem className="text-gray-500 max-w-[200px] truncate">
          {product.name}
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Product Details */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm">
          <img 
            src={product.imageUrl || "https://placehold.co/800x600?text=No+Image"} 
            alt={product.name}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="relative">
          {/* Promotional Banner */}
          <div className="absolute right-0 top-0 w-1/3 h-auto hidden md:block">
            <div 
              className="w-full h-auto rounded-lg p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white"
            >
              <h3 className="text-sm font-bold mb-1">Профессиональные инструменты</h3>
              <p className="text-xs">Для любых задач</p>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <Star className="h-4 w-4 fill-gray-200 text-gray-200" />
            </div>
            <span className="text-sm ml-2 text-gray-500">
              {product.rating} ({product.reviewCount} отзывов)
            </span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-sm text-gray-500">Артикул: {product.sku}</span>
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <span className="text-lg line-through text-gray-500 ml-3">{formatPrice(product.originalPrice)}</span>
              )}
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <span className="ml-3 bg-rose-100 text-rose-700 text-sm font-medium px-2 py-0.5 rounded">
                  Экономия {formatPrice(Number(product.originalPrice) - Number(product.price))}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {product.stock > 0 ? (
                <span className="text-emerald-600 font-medium">В наличии ({product.stock} шт.)</span>
              ) : (
                <span className="text-rose-600 font-medium">Нет в наличии</span>
              )}
            </p>
          </div>

          <p className="text-gray-600 mb-6">{product.shortDescription}</p>

          {/* Количество и Добавить в корзину */}
          <div className="flex space-x-3 mb-6">
            <div className="flex items-center border border-gray-300 rounded-md w-32">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="text-gray-500 hover:text-gray-700"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <Select value={quantity.toString()} onValueChange={handleQuantityChange}>
                <SelectTrigger className="border-0 focus:ring-0 text-center">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(10)].map((_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={increaseQuantity}
                className="text-gray-500 hover:text-gray-700"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              className="flex-1" 
              onClick={handleAddToCart} 
              disabled={isAddingToCart || product.stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              В корзину
            </Button>
          </div>

          {/* Преимущества */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-600">
              <Truck className="h-5 w-5 mr-3 text-primary" />
              <span>Бесплатная доставка при заказе от 5000 ₽</span>
            </div>
            <div className="flex items-center text-gray-600">
              <ShieldCheck className="h-5 w-5 mr-3 text-primary" />
              <span>Гарантия производителя 2 года</span>
            </div>
            <div className="flex items-center text-gray-600">
              <RefreshCw className="h-5 w-5 mr-3 text-primary" />
              <span>Возврат в течение 30 дней</span>
            </div>
          </div>
        </div>
      </div>

      {/* Вкладки с информацией о товаре */}
      <div className="mb-12">
        <Tabs defaultValue="description">
          <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
            <TabsTrigger value="description">Описание</TabsTrigger>
            <TabsTrigger value="specifications">Характеристики</TabsTrigger>
            <TabsTrigger value="reviews">Отзывы</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <p>{product.description || "Подробное описание для этого товара отсутствует."}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500">Артикул</div>
                    <div className="font-medium">{product.sku}</div>
                  </div>
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500">Категория</div>
                    <div className="font-medium">{categoryName}</div>
                  </div>
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500">Количество на складе</div>
                    <div className="font-medium">{product.stock} шт.</div>
                  </div>
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500">Вес</div>
                    <div className="font-medium">1.2 кг</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">Ещё нет отзывов</h3>
                  <p className="text-gray-500 mb-4">Будьте первым, кто оставит отзыв об этом товаре</p>
                  <Button variant="outline">Написать отзыв</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Похожие товары */}
      {relatedProducts.length > 1 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Похожие товары</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {relatedProducts
              .filter(p => p.id !== product.id)
              .slice(0, 4)
              .map(relatedProduct => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
