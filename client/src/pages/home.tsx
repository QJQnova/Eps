import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Drill, Hammer, Ruler, HardHat, Wrench, Settings } from "lucide-react";
import CategoryCard from "@/components/category/category-card";
import ProductList from "@/components/product/product-list";
import AppInstallBanner from "@/components/pwa/AppInstallBanner";
import { Category } from "@shared/schema";

export default function Home() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const searchQuery = queryParams.get('query') || '';
  const supplierParam = queryParams.get('supplier') || undefined;
  
  // Состояние для выбранного поставщика
  const [selectedSupplier, setSelectedSupplier] = useState<string | undefined>(supplierParam);
  
  // Fetch categories с учетом выбранного поставщика
  const { data: categories = [] } = useQuery<Category[]>({ 
    queryKey: ["/api/categories", selectedSupplier],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedSupplier) {
        params.append('supplier', selectedSupplier);
      }
      // Добавляем timestamp для принудительного обновления
      params.append('t', Date.now().toString());
      return fetch(`/api/categories?${params}`).then(res => res.json());
    },
    staleTime: 0, // Принудительное обновление
    gcTime: 0, // Не кешировать
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
      
      {/* Supplier Selection Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Выберите поставщика</h2>
            <p className="text-lg text-gray-600">Найдите инструменты от проверенных поставщиков</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Button 
              className={`${
                selectedSupplier === undefined 
                  ? "bg-eps-red text-white border-eps-red" 
                  : "bg-white text-gray-900 border-gray-200"
              } hover:bg-gray-50 border-2 hover:border-eps-red h-auto p-6 transition-all duration-300 group`}
              onClick={() => setSelectedSupplier(undefined)}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-full ${
                  selectedSupplier === undefined 
                    ? "bg-white/20" 
                    : "bg-gradient-to-r from-gray-600 to-gray-700"
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <HardHat className={`w-6 h-6 ${
                    selectedSupplier === undefined ? "text-white" : "text-white"
                  }`} />
                </div>
                <div className="text-center">
                  <p className={`text-sm ${
                    selectedSupplier === undefined ? "text-white/90" : "text-gray-600"
                  }`}>Полный каталог инструментов</p>
                </div>
              </div>
            </Button>

            <Button 
              className={`${
                selectedSupplier === 'DCK' 
                  ? "bg-eps-red text-white border-eps-red" 
                  : "bg-white text-gray-900 border-gray-200"
              } hover:bg-gray-50 border-2 hover:border-eps-red h-auto p-6 transition-all duration-300 group`}
              onClick={() => setSelectedSupplier('DCK')}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-full ${
                  selectedSupplier === 'DCK' 
                    ? "bg-white/20" 
                    : "bg-white"
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <img 
                    src="https://dcktools.ru/wp-content/themes/dck/images/logo.svg" 
                    alt="DCK Tools Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className={`text-sm ${
                    selectedSupplier === 'DCK' ? "text-white/90" : "text-gray-600"
                  }`}>Электроинструменты</p>
                </div>
              </div>
            </Button>

            <Button 
              className={`${
                selectedSupplier === 'tss' 
                  ? "bg-eps-red text-white border-eps-red" 
                  : "bg-white text-gray-900 border-gray-200"
              } hover:bg-gray-50 border-2 hover:border-eps-red h-auto p-6 transition-all duration-300 group`}
              onClick={() => setSelectedSupplier('tss')}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 rounded-full ${
                  selectedSupplier === 'tss' 
                    ? "bg-white/20" 
                    : "bg-white"
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <img 
                    src="https://gigamarket.by/upload/iblock/bed/uraa243d5ayfwvu1y4vnn64z5qy34hb8/CD.jpg" 
                    alt="TSS Logo"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className={`text-sm ${
                    selectedSupplier === 'tss' ? "text-white/90" : "text-gray-600"
                  }`}>Промышленное оборудование</p>
                </div>
              </div>
            </Button>
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
          <ProductList query={searchQuery} supplier={selectedSupplier} />
        </div>
      </section>
    </div>
  );
}
