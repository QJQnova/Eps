import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import ProductCard from "@/components/product/product-card";
import Pagination from "@/components/ui/pagination";
import { Product } from "@shared/schema";

interface ProductListProps {
  query?: string;
  categoryId?: number;
  limit?: number;
}

export default function ProductList({ query, categoryId, limit = 12 }: ProductListProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (query) queryParams.append("query", query);
  if (categoryId) queryParams.append("categoryId", categoryId.toString());
  queryParams.append("sort", sort);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  
  // Fetch products
  const { data, isLoading } = useQuery<{
    products: Product[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }>({ 
    queryKey: [`/api/products?${queryParams.toString()}`],
  });
  
  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1); // Reset to first page when sort changes
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top of product list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-eps-gradient">
            {query ? `Результаты поиска: "${query}"` : "Рекомендуемые товары"}
          </h2>
          <p className="text-gray-500">
            {isLoading ? "Загрузка товаров..." : 
             `Найдено ${data?.pagination.total || 0} ${data?.pagination.total === 1 ? 'товар' : 
               (data?.pagination.total && data.pagination.total >= 2 && data.pagination.total <= 4) ? 'товара' : 'товаров'}`}
          </p>
        </div>
        
        <div className="w-full md:w-auto mt-4 md:mt-0 flex items-center space-x-4">
          {/* Sort Options */}
          <div className="relative w-full md:w-auto">
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Рекомендуемые</SelectItem>
                <SelectItem value="price-low">Цена: по возрастанию</SelectItem>
                <SelectItem value="price-high">Цена: по убыванию</SelectItem>
                <SelectItem value="newest">Новинки</SelectItem>
                <SelectItem value="popular">Популярные</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Toggle Grid/List View */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className={viewMode === "grid" ? "bg-primary text-white border-r border-gray-300" : "bg-white text-gray-700 border-r border-gray-300"}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className={viewMode === "list" ? "bg-primary text-white" : "bg-white text-gray-700"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        // Loading skeleton
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow">
              <Skeleton className="w-full h-56" />
              <div className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-5/6 mb-1" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.products && data.products.length > 0 ? (
        <>
          <div className={`grid ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" 
              : "grid-cols-1 gap-4"
          }`}>
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {data.pagination.totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination 
                currentPage={data.pagination.page} 
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-xl font-medium text-eps-gradient mb-2">Товары не найдены</h3>
          <p className="text-gray-500 max-w-md">
            Мы не смогли найти товары, соответствующие вашему запросу. Попробуйте изменить параметры поиска или фильтры.
          </p>
        </div>
      )}
    </div>
  );
}
