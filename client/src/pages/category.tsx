import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";
import ProductList from "@/components/product/product-list";
import { Category } from "@shared/schema";

export default function CategoryPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  
  // Fetch category details с оптимизированным кешированием
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000, // 5 минут - категории меняются редко
    gcTime: 900000, // 15 минут в памяти
  });
  
  const category = categories.find(cat => cat.slug === slug);
  
  // Redirect to home if category doesn't exist
  if (categories.length > 0 && !category) {
    navigate("/");
    return null;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">
            <Home className="h-4 w-4 mr-1" />
            Главная
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <span className="text-gray-500">{category?.name || 'Category'}</span>
        </BreadcrumbItem>
      </Breadcrumb>
      
      {/* Hero Section */}
      <div className="bg-gray-100 rounded-lg p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{category?.name || 'Category'}</h1>
        <p className="text-gray-600">{category?.description || 'Browse our selection of high-quality tools'}</p>
      </div>
      
      {/* Products */}
      {category && <ProductList categoryId={category.id} />}
    </div>
  );
}
