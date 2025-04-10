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
  
  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({ 
    queryKey: ["/api/categories"],
  });
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-eps-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Профессиональные инструменты для любых задач
              </h1>
              <p className="text-lg mb-6">
                Качественные инструменты для профессионалов и любителей. Найдите подходящее оборудование для вашего следующего проекта.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="secondary"
                  className="bg-white text-eps-orange hover:bg-gray-100 font-medium"
                  asChild
                >
                  <Link href="#products">Купить сейчас</Link>
                </Button>
                <Button 
                  variant="outline"
                  className="bg-transparent hover:bg-white/10 border border-white font-medium"
                  asChild
                >
                  <Link href="#categories">Посмотреть категории</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1581147036324-c47a03a07739?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80" 
                alt="Коллекция профессиональных инструментов" 
                className="rounded-lg shadow-xl" 
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-eps-orange/10 flex items-center justify-center mb-3">
                <Wrench className="h-6 w-6 text-eps-orange" />
              </div>
              <h3 className="font-medium">Высокое качество</h3>
              <p className="text-sm text-gray-500 mt-1">Профессиональные инструменты</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-eps-red/10 flex items-center justify-center mb-3">
                <Drill className="h-6 w-6 text-eps-red" />
              </div>
              <h3 className="font-medium">Гарантия</h3>
              <p className="text-sm text-gray-500 mt-1">На все инструменты</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-eps-yellow/10 flex items-center justify-center mb-3">
                <Ruler className="h-6 w-6 text-eps-yellow" />
              </div>
              <h3 className="font-medium">Доставка</h3>
              <p className="text-sm text-gray-500 mt-1">По всей России</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-eps-orange/10 flex items-center justify-center mb-3">
                <HardHat className="h-6 w-6 text-eps-orange" />
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
            <h2 className="text-2xl font-bold mb-8 text-eps-gradient">Каталог по категориям</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Products Section */}
      <section id="products" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductList query={searchQuery} />
        </div>
      </section>
    </div>
  );
}
