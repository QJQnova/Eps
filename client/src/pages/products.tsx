import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";

import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Category } from "@shared/schema";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";
import ProductList from "@/components/product/product-list";

export default function Products() {
  // Получение параметров из URL
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialQuery = params.get("query") || "";
  const initialCategoryId = params.get("categoryId") || "";
  
  // Состояние для фильтров
  const [query, setQuery] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategoryId ? parseInt(initialCategoryId) : undefined
  );
  
  // Получение списка категорий
  const { data: categories = [] } = useQuery<Category[]>({ 
    queryKey: ["/api/categories"],
  });
  
  // При изменении URL обновляем состояние компонента
  useEffect(() => {
    const newParams = new URLSearchParams(location.split("?")[1] || "");
    setQuery(newParams.get("query") || "");
    setCategoryId(newParams.get("categoryId") ? parseInt(newParams.get("categoryId") || "") : undefined);
  }, [location]);
  
  // Получение названия текущей категории если выбрана
  const categoryName = categoryId 
    ? categories.find(c => c.id === categoryId)?.name 
    : "Все товары";
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <Helmet>
        <title>{categoryName ? `${categoryName} - ЭПС` : "Каталог товаров - ЭПС"}</title>
        <meta name="description" content="Широкий ассортимент инструментов и оборудования для профессионалов по доступным ценам" />
      </Helmet>
      
      {/* Hero section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {categoryName || "Каталог товаров"}
          </h1>
          <Breadcrumb className="text-gray-300">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" />
                    <span>Главная</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {!categoryId ? (
                  <BreadcrumbPage>Каталог</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href="/products">Каталог</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {categoryId && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{categoryName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      
      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Категория
            </label>
            <Select 
              value={categoryId?.toString() || "0"} 
              onValueChange={(value) => setCategoryId(value !== "0" ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Все категории</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-2/3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Поиск по названию
            </label>
            <Input
              type="text"
              placeholder="Введите название товара..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Информация о ценах и процессе заказа */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Как работают цены на нашем сайте</h3>
              <div className="text-blue-800 text-sm leading-relaxed">
                <p className="mb-3">
                  Цены могут меняться, так как мы всегда стремимся предложить лучшие условия для наших партнёров. 
                  Точную стоимость вы узнаете, добавив товары в корзину и открыв заявку для связи с менеджером.
                </p>
                <p className="mb-3">
                  Также можно позвонить для обсуждения деталей, но через сайт это удобнее. Менеджер проанализирует 
                  вашу корзину, подготовит коммерческое предложение и отправит его вам в чат и личный кабинет.
                </p>
                <p>
                  Как только предложение будет готово, вы получите уведомление на сайте и на почту.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Products */}
        <ProductList 
          query={query} 
          categoryId={categoryId} 
          limit={12}
        />
      </div>
    </div>
  );
}