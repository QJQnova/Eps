import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet";
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
  const [option, setOption] = useState("default");
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const { toast } = useToast();

  // Fetch product details с улучшенным кешированием
  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: [`/api/products/slug/${slug}`],
    staleTime: 120000, // 2 минуты кеширования для деталей товара
  });

  // Fetch categories for breadcrumbs с минимальными обновлениями (категории меняются редко)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000, // 5 минут кеширования для категорий
  });
  
  // Fetch related products based on category - с оптимизацией кеширования
  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/categories', product?.categoryId, 'products'],
    enabled: !!product?.categoryId,
    staleTime: 60000, // кеширование на 1 минуту для улучшения производительности
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

  // Set page title and meta description
  const pageTitle = product ? `${product.name} - ЭПС` : "Загрузка товара - ЭПС";

  if (isLoadingProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content="Загрузка информации о товаре - ЭПС" />
        </Helmet>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={product.shortDescription || product.description?.substring(0, 160) || `${product.name} - Качественный инструмент от компании ЭПС`} />
      </Helmet>
      
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6 text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="text-gray-500 hover:text-eps-red flex items-center transition-colors">
              <Home className="h-3.5 w-3.5 mr-1.5" />
              Главная
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/category/${categories.find(cat => cat.id === product.categoryId)?.slug || ''}`} className="text-gray-500 hover:text-eps-red transition-colors">
              {categoryName}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </BreadcrumbSeparator>
        <BreadcrumbItem className="text-gray-400 max-w-[200px] truncate">
          {product.name}
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Product Details */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Product Images Section */}
        <div className="flex flex-col space-y-5">
          {/* Main Product Image with Shadow and Border */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 p-4 md:p-6 transition-all duration-300 hover:shadow-lg">
            <div className="relative aspect-square bg-gray-50 rounded-md flex items-center justify-center overflow-hidden product-image-container">
              <img
                src={product.imageUrl || "https://placehold.co/600x400?text=Нет+изображения"}
                alt={product.name}
                className="max-w-full max-h-full object-contain transition-transform duration-700 product-image"
              />
              
              {/* Badge for sale or discount if available */}
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <div className="absolute top-3 left-3 bg-eps-red text-white text-xs font-bold px-2.5 py-1.5 rounded-md shadow-sm">
                  -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                </div>
              )}
            </div>
          </div>

          {/* Тематический баннер */}
          <div className="bg-gradient-to-r from-eps-red via-red-600 to-eps-yellow rounded-lg overflow-hidden shadow-md">
            <div className="p-5 pb-0 flex md:flex-row flex-col">
              <div className="md:w-1/2">
                <h3 className="text-xl font-bold text-white mb-2">Коллекция профессиональных инструментов</h3>
                <p className="text-white/90 text-sm mb-4">Качество, надежность и долговечность для настоящих профессионалов</p>
                <div className="inline-block mb-6 md:mb-0">
                  <Button 
                    variant="secondary" 
                    className="bg-white/90 hover:bg-white text-eps-red hover:text-red-700 border-0 font-medium"
                    asChild
                  >
                    <Link href="/products">Смотреть все инструменты</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 relative md:h-auto h-20 overflow-hidden">
                {/* Анимированный слайдер с инструментами */}
                <div className="absolute inset-0 flex items-center animate-slider">
                  {/* Инструмент 1: Дрель */}
                  <div className="flex-shrink-0 w-20 h-20 mx-2 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 15V9C5 7.89543 5.89543 7 7 7H15C16.1046 7 17 7.89543 17 9V15C17 16.1046 16.1046 17 15 17H7C5.89543 17 5 16.1046 5 15Z" stroke="white" strokeWidth="1.5"/>
                      <path d="M17 12H20C20.5523 12 21 11.5523 21 11V10C21 9.44772 20.5523 9 20 9H17V12Z" stroke="white" strokeWidth="1.5"/>
                      <path d="M9 21V17M13 21V17" stroke="white" strokeWidth="1.5"/>
                      <path d="M8 7V5C8 4.44772 8.44772 4 9 4H13C13.5523 4 14 4.44772 14 5V7" stroke="white" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  
                  {/* Инструмент 2: Пила */}
                  <div className="flex-shrink-0 w-20 h-20 mx-2 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 12H20" stroke="white" strokeWidth="1.5"/>
                      <path d="M5 9V15" stroke="white" strokeWidth="1.5"/>
                      <path d="M8 7V17" stroke="white" strokeWidth="1.5"/>
                      <path d="M11 9V15" stroke="white" strokeWidth="1.5"/>
                      <path d="M14 7V17" stroke="white" strokeWidth="1.5"/>
                      <path d="M17 9V15" stroke="white" strokeWidth="1.5"/>
                      <path d="M20 8V16" stroke="white" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  
                  {/* Инструмент 3: Отвертка */}
                  <div className="flex-shrink-0 w-20 h-20 mx-2 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 3L21 7" stroke="white" strokeWidth="1.5"/>
                      <path d="M15 5L19 9" stroke="white" strokeWidth="1.5"/>
                      <path d="M14 10L6 18C5.44772 18.5523 4.55228 18.5523 4 18L6 20C5.44772 19.4477 5.44772 18.5523 6 18L14 10" stroke="white" strokeWidth="1.5"/>
                      <path d="M17 7L7 17C6.44772 17.5523 5.55228 17.5523 5 17C4.44772 16.4477 4.44772 15.5523 5 15L15 5" stroke="white" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  
                  {/* Повторяем инструменты для бесконечной анимации */}
                  <div className="flex-shrink-0 w-20 h-20 mx-2 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 15V9C5 7.89543 5.89543 7 7 7H15C16.1046 7 17 7.89543 17 9V15C17 16.1046 16.1046 17 15 17H7C5.89543 17 5 16.1046 5 15Z" stroke="white" strokeWidth="1.5"/>
                      <path d="M17 12H20C20.5523 12 21 11.5523 21 11V10C21 9.44772 20.5523 9 20 9H17V12Z" stroke="white" strokeWidth="1.5"/>
                      <path d="M9 21V17M13 21V17" stroke="white" strokeWidth="1.5"/>
                      <path d="M8 7V5C8 4.44772 8.44772 4 9 4H13C13.5523 4 14 4.44772 14 5V7" stroke="white" strokeWidth="1.5"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* SKU and category info */}
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Артикул: {product.sku}</span>
            <span className="mx-2">•</span>
            <span>Категория: {categoryName}</span>
          </div>
          
          {/* Product Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>
          
          {/* Ratings */}
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < (Number(product.rating) || 0) ? 'fill-eps-yellow text-eps-yellow' : 'text-gray-200'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">{product.rating || 0} из 5</span>
            {product.reviewCount && (
              <span className="text-sm text-gray-500 ml-2">({product.reviewCount} отзывов)</span>
            )}
          </div>

          {/* Price Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              {product.originalPrice && Number(product.originalPrice) > Number(product.price) ? (
                <>
                  <div className="text-3xl font-bold text-eps-red">
                    {formatPrice(product.price)}
                  </div>
                  <div className="text-lg text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </div>
                  <div className="bg-eps-red text-white text-sm font-semibold px-2 py-1 rounded">
                    -{Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)}%
                  </div>
                </>
              ) : (
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {(product.stock && product.stock > 0) ? (
                <span className="text-emerald-600 font-medium">В наличии ({product.stock} шт.)</span>
              ) : (
                <span className="text-rose-600 font-medium">Нет в наличии</span>
              )}
            </div>
          </div>
          
          {/* Product Description */}
          <div className="prose prose-sm text-gray-700 mb-6">
            <p>{product.shortDescription || product.description}</p>
          </div>
          
          {/* Features Section */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-start p-3 bg-red-50 rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 text-eps-red feature-icon">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Гарантия</p>
                <p className="text-xs text-gray-600">24 месяца на все инструменты</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3 text-eps-yellow feature-icon">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Доставка</p>
                <p className="text-xs text-gray-600">Доставка по всей России</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 bg-red-50 rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 text-eps-red feature-icon">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Возврат</p>
                <p className="text-xs text-gray-600">14 дней на возврат товара</p>
              </div>
            </div>
            
            {/* Extra feature slot */}
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3 text-eps-yellow feature-icon">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6V10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 10L19 17" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 7H15" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 4H17V7C17 8.65685 15.6569 10 14 10H10C8.34315 10 7 8.65685 7 7V4Z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Качество</p>
                <p className="text-xs text-gray-600">Профессиональный инструмент</p>
              </div>
            </div>
          </div>
          
          {/* Quantity and Options Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-sm font-medium text-gray-700 mr-3">Количество:</span>
              <div className="flex items-center bg-white rounded-md border border-gray-300 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-gray-100"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <MinusCircle className="h-4 w-4 text-gray-500" />
                </Button>
                <span className="mx-3 text-sm font-medium text-gray-900 min-w-[1.5rem] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-gray-100"
                  onClick={increaseQuantity}
                >
                  <PlusCircle className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-3">Опция:</span>
              <Select value={option} onValueChange={setOption}>
                <SelectTrigger className="w-36 border-gray-300 focus:ring-eps-red focus:border-eps-red bg-white">
                  <SelectValue placeholder="Опция" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Стандарт</SelectItem>
                  <SelectItem value="pro">Профессиональный</SelectItem>
                  <SelectItem value="premium">Премиум</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              className="bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-red-800 text-white w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200 border-0"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAddingToCart ? "Добавление..." : "Добавить в корзину"}
            </Button>
            
            <Button 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full h-12 text-base font-medium transition-all duration-200"
              onClick={() => window.open('tel:+78001013835', '_self')}
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Позвонить
            </Button>
          </div>
        </div>
      </div>

      {/* Вкладки с информацией о товаре */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-eps-red to-eps-yellow">
            Дополнительная информация
          </span>
          <div className="h-px flex-grow bg-gradient-to-r from-red-300 to-transparent ml-4"></div>
        </h2>
        
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full md:w-auto bg-gray-100 p-1 rounded-lg mb-6 border border-gray-200">
            <TabsTrigger 
              value="description" 
              className="data-[state=active]:bg-white data-[state=active]:text-eps-red data-[state=active]:shadow-sm rounded-md text-sm font-medium"
            >
              Описание
            </TabsTrigger>
            <TabsTrigger 
              value="specifications" 
              className="data-[state=active]:bg-white data-[state=active]:text-eps-red data-[state=active]:shadow-sm rounded-md text-sm font-medium"
            >
              Характеристики
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="data-[state=active]:bg-white data-[state=active]:text-eps-red data-[state=active]:shadow-sm rounded-md text-sm font-medium"
            >
              Отзывы
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="description">
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
                <div className="prose max-w-none">
                  <p>{product?.description || "Подробное описание для этого товара отсутствует."}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="specifications">
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Основные характеристики</h3>
                    
                    <div className="flex justify-between p-3 bg-white border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">Артикул</span>
                      <span className="text-sm font-medium">{product?.sku}</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-white border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">Категория</span>
                      <span className="text-sm font-medium">{categoryName}</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-white border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">Наличие</span>
                      <span className={`text-sm font-medium ${product.stock && product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {product.stock && product.stock > 0 ? `В наличии (${product.stock} шт.)` : 'Нет в наличии'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Технические характеристики</h3>
                    
                    <div className="flex justify-between p-3 bg-white border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">Вес</span>
                      <span className="text-sm font-medium">1.2 кг</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-white border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">Габариты</span>
                      <span className="text-sm font-medium">30 × 15 × 10 см</span>
                    </div>
                    
                    <div className="flex justify-between p-3 bg-white border border-gray-100 rounded-lg">
                      <span className="text-sm text-gray-600">Гарантия</span>
                      <span className="text-sm font-medium">24 месяца</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50">
                <div className="text-center py-10">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-red-100 text-eps-red rounded-full">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.2451 7.90983C14.379 8.32185 14.763 8.60081 15.1962 8.60081H19.3839C20.3527 8.60081 20.7554 9.84043 19.9717 10.4098L16.5838 12.8713C16.2333 13.126 16.0866 13.5773 16.2205 13.9894L17.5146 17.9721C17.8139 18.8934 16.7595 19.6596 15.9757 19.0902L12.5878 16.6287C12.2373 16.374 11.7627 16.374 11.4122 16.6287L8.02426 19.0902C7.24054 19.6596 6.18607 18.8934 6.48542 17.9721L7.77949 13.9894C7.91338 13.5773 7.76672 13.126 7.41623 12.8713L4.02827 10.4098C3.24455 9.84043 3.64732 8.60081 4.61606 8.60081H8.8038C9.23703 8.60081 9.62099 8.32185 9.75488 7.90983L11.0489 3.92705Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Ещё нет отзывов</h3>
                  <p className="text-gray-500 mb-6 max-w-lg mx-auto">Будьте первым, кто оставит отзыв об этом товаре. Ваше мнение поможет другим покупателям сделать правильный выбор.</p>
                  <Button className="bg-eps-red hover:bg-red-700 text-white">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Написать отзыв
                  </Button>
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
