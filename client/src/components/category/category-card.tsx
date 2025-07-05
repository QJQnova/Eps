import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Получаем фотографию для категории
  const getCategoryImage = () => {
    const name = category.name.toLowerCase();
    
    // Возвращаем URL фотографии на основе категории
    if (name.includes('аккумулятор') || name.includes('батарея')) {
      return `https://images.unsplash.com/photo-1609592158064-4b76e4a4b6c8?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('дрель')) {
      return `https://images.unsplash.com/photo-1581244236164-b0c7e7d2d5f3?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('молоток') || name.includes('кувалда')) {
      return `https://images.unsplash.com/photo-1567621141318-c76f7ad5e6d1?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('линейка') || name.includes('рулетка') || name.includes('измер')) {
      return `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('электр') || name.includes('генератор')) {
      return `https://images.unsplash.com/photo-1606822724315-a2f8d0c5c3c4?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('пила') || name.includes('ножовка') || name.includes('отрезн')) {
      return `https://images.unsplash.com/photo-1558618666-4c5a3e1f0c9d?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('отверт') || name.includes('шуруповерт')) {
      return `https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('ключ') || name.includes('гаечный')) {
      return `https://images.unsplash.com/photo-1609845725580-b6d5e1d1e7e7?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('кабель') || name.includes('провод')) {
      return `https://images.unsplash.com/photo-1603145733146-ae562a55031e?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('фонар') || name.includes('свет')) {
      return `https://images.unsplash.com/photo-1580930462213-9f2f4d1e3d5c?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('каска') || name.includes('защит')) {
      return `https://images.unsplash.com/photo-1591984923899-d8e2b5e7d7c7?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('механизм') || name.includes('редуктор')) {
      return `https://images.unsplash.com/photo-1609845725580-b6d5e1d1e7e7?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('ножниц') || name.includes('кусачки')) {
      return `https://images.unsplash.com/photo-1567621141318-c76f7ad5e6d1?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('замок') || name.includes('безопасн')) {
      return `https://images.unsplash.com/photo-1615880484746-a7d4b5c5b1c9?w=400&h=400&fit=crop&crop=center`;
    }
    if (name.includes('расходн') || name.includes('комплект')) {
      return `https://images.unsplash.com/photo-1609845725580-b6d5e1d1e7e7?w=400&h=400&fit=crop&crop=center`;
    }
    
    // По умолчанию - общие инструменты
    return `https://images.unsplash.com/photo-1609845725580-b6d5e1d1e7e7?w=400&h=400&fit=crop&crop=center`;
  };

  // Определим цвет категории на основе ее названия
  const getCategoryColor = () => {
    const colors = ["eps-orange", "eps-red", "eps-yellow"];
    const index = Math.abs(category.id) % 3; // используем ID для определения цвета
    return colors[index];
  };

  const colorClass = getCategoryColor();

  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 h-64">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${colorClass}/5 via-transparent to-${colorClass}/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        
        {/* Top Border Line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-${colorClass} to-${colorClass}/70 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
        
        <CardContent className="relative p-6 text-center h-full flex flex-col justify-between">
          <div className="flex flex-col items-center flex-1">
            {/* Category Image */}
            <div className={`w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl`}>
              <img 
                src={getCategoryImage()} 
                alt={category.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback к цветному фону если изображение не загружается
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.className += ` bg-gradient-to-br from-${colorClass}/10 to-${colorClass}/20`;
                }}
              />
            </div>
            
            {/* Category Name */}
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-gray-800 transition-colors duration-200 mb-3 min-h-[3.5rem] flex items-center justify-center text-center leading-tight">
              {category.name.length > 20 ? category.name.substring(0, 17) + '...' : category.name}
            </h3>
          </div>
          
          {/* Product Count with Badge Style */}
          <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 group-hover:bg-${colorClass}/10 transition-colors duration-200 self-center`}>
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
              {category.productCount || 0} {category.productCount === 1 ? 'товар' : 
               (category.productCount && category.productCount >= 2 && category.productCount <= 4) ? 'товара' : 'товаров'}
            </span>
          </div>
          
          {/* Hover Effect Arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className={`w-6 h-6 rounded-full bg-${colorClass} flex items-center justify-center shadow-lg`}>
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}