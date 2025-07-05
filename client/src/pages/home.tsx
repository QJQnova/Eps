import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Drill, Hammer, Ruler, HardHat, Wrench } from "lucide-react";
import CategoryCard from "@/components/category/category-card";
import ProductList from "@/components/product/product-list";
import AppInstallBanner from "@/components/pwa/AppInstallBanner";
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
      <Helmet>
        <title>ЭПС</title>
        <meta name="description" content="Профессиональные инструменты и оборудование от компании ЭПС. Широкий ассортимент по выгодным ценам." />
      </Helmet>
      {/* Hero Section - Центрированный дизайн */}
      <section className="relative bg-gradient-to-r from-eps-red via-red-500 to-eps-yellow text-white overflow-hidden min-h-[80vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center hero-slide-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-tight">
              <span className="block text-white">Коллекция</span>
              <span className="block text-white">профессиональных</span>
              <span className="block text-white">инструментов</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-12 text-white/95 max-w-4xl mx-auto">
              Высококачественные инструменты для профессионалов и любителей. Создавайте с лучшим оборудованием.
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <Button 
                size="lg"
                className="bg-white text-eps-red hover:bg-gray-50 transition-all font-semibold px-10 py-5 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105"
                asChild
              >
                <Link href="#products">Купить сейчас</Link>
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="bg-transparent hover:bg-white/20 border-2 border-white text-white font-semibold px-10 py-5 text-lg rounded-full hover:scale-105 transition-all"
                asChild
              >
                <Link href="#categories">Посмотреть категории</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Декоративные элементы */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>
      </section>
      
      {/* Features Section - Красивые карточки как в примере */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-eps-red to-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Высокое качество</h3>
              <p className="text-gray-600 leading-relaxed">Профессиональные инструменты</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Гарантия</h3>
              <p className="text-gray-600 leading-relaxed">На все инструменты</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-eps-yellow to-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Доставка</h3>
              <p className="text-gray-600 leading-relaxed">По всей России</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Консультации</h3>
              <p className="text-gray-600 leading-relaxed">Профессиональная помощь</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      {!searchQuery && (
        <section id="categories" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-red-50/30 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-eps-orange/5 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-eps-red/5 to-transparent rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Beautiful Header with Icon */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-eps-red to-red-600 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-eps-red via-red-600 to-red-700 bg-clip-text text-transparent">
                Каталог по категориям
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Выберите подходящую категорию инструментов для вашей работы
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Баннер установки приложения */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AppInstallBanner />
        </div>
      </section>
      
      {/* Products Section */}
      <section id="products" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductList query={searchQuery} />
        </div>
      </section>
    </div>
  );
}
