import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Drill, Hammer, Ruler, HardHat } from "lucide-react";
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
      <section className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Professional Tools for Every Job
              </h1>
              <p className="text-lg mb-6">
                High quality tools for professionals and DIY enthusiasts. Get the right equipment for your next project.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="secondary"
                  className="bg-white text-primary hover:bg-gray-100 font-medium"
                  asChild
                >
                  <Link href="#products">Shop Now</Link>
                </Button>
                <Button 
                  variant="outline"
                  className="bg-transparent hover:bg-white/10 border border-white font-medium"
                  asChild
                >
                  <Link href="#categories">View Categories</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1581147036324-c47a03a07739?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80" 
                alt="Professional tools collection" 
                className="rounded-lg shadow-xl" 
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      {!searchQuery && (
        <section id="categories" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Shop by Category</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Products Section */}
      <section id="products" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductList query={searchQuery} />
        </div>
      </section>
    </div>
  );
}
