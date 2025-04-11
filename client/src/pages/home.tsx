import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Drill, Hammer, Ruler, HardHat, Wrench } from "lucide-react";
import CategoryCard from "@/components/category/category-card";
import ProductList from "@/components/product/product-list";
import { Category } from "@shared/schema";

export default function Home() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const searchQuery = queryParams.get('query') || '';
  
  // Fetch categories с увеличенным временем кеширования
  const { data: categories = [] } = useQuery<Category[]>({ 
    queryKey: ["/api/categories"],
    staleTime: 300000, // 5 минут
    gcTime: 900000, // 15 минут кеширования в памяти
  });
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-eps-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                <span className="relative inline-block">
                  <span className="animate-text-gradient">Профессиональные инструменты</span>
                  <span className="absolute inset-0 animate-text-gradient opacity-70 blur-sm">Профессиональные инструменты</span>
                </span> для любых задач
              </h1>
              <p className="text-lg mb-6 opacity-90">
                Качественные инструменты для профессионалов и любителей. Найдите подходящее оборудование для вашего следующего проекта.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="secondary"
                  className="bg-white text-eps-orange hover:bg-gray-100 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover-wiggle"
                  asChild
                >
                  <Link href="#products">Купить сейчас</Link>
                </Button>
                <Button 
                  variant="outline"
                  className="bg-transparent hover:bg-white/20 border border-white font-medium transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <Link href="#categories">Посмотреть категории</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block relative overflow-hidden rounded-lg shadow-xl bg-gray-800 h-[400px]">
              <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)] z-10 flex items-center justify-center">
                <div className="text-white text-center p-6">
                  <h2 className="text-2xl font-bold mb-2">Коллекция профессиональных инструментов</h2>
                  <p className="text-gray-200">ЭПС - надежный поставщик инструментов с 2005 года</p>
                </div>
              </div>
              
              {/* Слайдер изображений */}
              <div className="absolute inset-0 z-0">
                <div className="flex animate-slider w-[200%] h-full">
                  {/* Первая группа изображений */}
                  <div className="grid grid-cols-2 w-full h-full">
                    <div className="bg-[#f97316] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 15V9C5 7.89543 5.89543 7 7 7H15C16.1046 7 17 7.89543 17 9V15C17 16.1046 16.1046 17 15 17H7C5.89543 17 5 16.1046 5 15Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M17 12H20C20.5523 12 21 11.5523 21 11V10C21 9.44772 20.5523 9 20 9H17V12Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M9 21V17M13 21V17" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 7V5C8 4.44772 8.44772 4 9 4H13C13.5523 4 14 4.44772 14 5V7" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div className="bg-[#ef4444] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 8L3 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M7 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M11 6V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M15 3V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M19 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M3 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="bg-[#eab308] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6V10" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 10L19 17" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M9 7H15" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 4H17V7C17 8.65685 15.6569 10 14 10H10C8.34315 10 7 8.65685 7 7V4Z" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div className="bg-[#06b6d4] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 3L21 7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M15 5L19 9" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M14 10L6 18C5.44772 18.5523 4.55228 18.5523 4 18L6 20C5.44772 19.4477 5.44772 18.5523 6 18L14 10" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M17 7L7 17C6.44772 17.5523 5.55228 17.5523 5 17C4.44772 16.4477 4.44772 15.5523 5 15L15 5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  </div>

                  {/* Вторая группа изображений (для непрерывной анимации) */}
                  <div className="grid grid-cols-2 w-full h-full">
                    <div className="bg-[#f97316] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 15V9C5 7.89543 5.89543 7 7 7H15C16.1046 7 17 7.89543 17 9V15C17 16.1046 16.1046 17 15 17H7C5.89543 17 5 16.1046 5 15Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M17 12H20C20.5523 12 21 11.5523 21 11V10C21 9.44772 20.5523 9 20 9H17V12Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M9 21V17M13 21V17" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 7V5C8 4.44772 8.44772 4 9 4H13C13.5523 4 14 4.44772 14 5V7" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div className="bg-[#ef4444] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 8L3 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M7 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M11 6V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M15 3V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M19 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M3 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="bg-[#eab308] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6V10" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 10L19 17" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M9 7H15" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 4H17V7C17 8.65685 15.6569 10 14 10H10C8.34315 10 7 8.65685 7 7V4Z" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div className="bg-[#06b6d4] p-4 flex items-center justify-center">
                      <svg className="w-28 h-28 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 3L21 7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M15 5L19 9" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M14 10L6 18C5.44772 18.5523 4.55228 18.5523 4 18L6 20C5.44772 19.4477 5.44772 18.5523 6 18L14 10" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M17 7L7 17C6.44772 17.5523 5.55228 17.5523 5 17C4.44772 16.4477 4.44772 15.5523 5 15L15 5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4 animate-fadeIn rounded-lg transition-all duration-300 hover:shadow-md hover:bg-eps-orange/5" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-full bg-eps-orange/10 flex items-center justify-center mb-3 transition-all duration-300 transform group-hover:scale-110">
                <Wrench className="h-6 w-6 text-eps-orange animate-pulse-slow" />
              </div>
              <h3 className="font-medium">Высокое качество</h3>
              <p className="text-sm text-gray-500 mt-1">Профессиональные инструменты</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 animate-fadeIn rounded-lg transition-all duration-300 hover:shadow-md hover:bg-eps-red/5" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-full bg-eps-red/10 flex items-center justify-center mb-3 transition-all duration-300 transform group-hover:scale-110">
                <Drill className="h-6 w-6 text-eps-red animate-pulse-slow" />
              </div>
              <h3 className="font-medium">Гарантия</h3>
              <p className="text-sm text-gray-500 mt-1">На все инструменты</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 animate-fadeIn rounded-lg transition-all duration-300 hover:shadow-md hover:bg-eps-yellow/5" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 rounded-full bg-eps-yellow/10 flex items-center justify-center mb-3 transition-all duration-300 transform group-hover:scale-110">
                <Ruler className="h-6 w-6 text-eps-yellow animate-pulse-slow" />
              </div>
              <h3 className="font-medium">Доставка</h3>
              <p className="text-sm text-gray-500 mt-1">По всей России</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 animate-fadeIn rounded-lg transition-all duration-300 hover:shadow-md hover:bg-eps-orange/5" style={{ animationDelay: '0.5s' }}>
              <div className="w-12 h-12 rounded-full bg-eps-orange/10 flex items-center justify-center mb-3 transition-all duration-300 transform group-hover:scale-110">
                <HardHat className="h-6 w-6 text-eps-orange animate-pulse-slow" />
              </div>
              <h3 className="font-medium">Консультации</h3>
              <p className="text-sm text-gray-500 mt-1">Профессиональная помощь</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      {!searchQuery && (
        <section id="categories" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8 animate-text-gradient inline-block">Каталог по категориям</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <div key={category.id} className="animate-fadeIn" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                  <CategoryCard category={category} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Products Section */}
      <section id="products" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8 animate-text-gradient inline-block">Популярные товары</h2>
          <ProductList query={searchQuery} />
        </div>
      </section>
    </div>
  );
}
