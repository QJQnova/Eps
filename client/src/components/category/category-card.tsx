import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@shared/schema";
import { 
  Bolt, 
  Drill, 
  Hammer, 
  Ruler,
  Zap,
  Gauge,
  Cable,
  Wrench,
  Battery,
  Disc,
  RotateCcw,
  Settings,
  Flashlight,
  HardHat,
  Cog,
  Scissors,
  Lock,
  ShoppingCart,
} from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Получаем иконку для категории
  const getIcon = () => {
    const name = category.name.toLowerCase();
    
    if (name.includes('аккумулятор') || name.includes('батарея')) return <Battery className="h-8 w-8" />;
    if (name.includes('дрель')) return <Drill className="h-8 w-8" />;
    if (name.includes('молоток') || name.includes('кувалда')) return <Hammer className="h-8 w-8" />;
    if (name.includes('линейка') || name.includes('рулетка') || name.includes('измер')) return <Ruler className="h-8 w-8" />;
    if (name.includes('электр') || name.includes('генератор')) return <Zap className="h-8 w-8" />;
    if (name.includes('манометр') || name.includes('датчик')) return <Gauge className="h-8 w-8" />;
    if (name.includes('кабель') || name.includes('провод')) return <Cable className="h-8 w-8" />;
    if (name.includes('ключ') || name.includes('гаечный')) return <Wrench className="h-8 w-8" />;
    if (name.includes('пила') || name.includes('ножовка') || name.includes('отрезн')) return <Disc className="h-8 w-8" />;
    if (name.includes('отверт') || name.includes('шуруповерт')) return <RotateCcw className="h-8 w-8" />;
    if (name.includes('настройк') || name.includes('регулировк')) return <Settings className="h-8 w-8" />;
    if (name.includes('фонар') || name.includes('свет')) return <Flashlight className="h-8 w-8" />;
    if (name.includes('каска') || name.includes('защит')) return <HardHat className="h-8 w-8" />;
    if (name.includes('механизм') || name.includes('редуктор')) return <Cog className="h-8 w-8" />;
    if (name.includes('ножниц') || name.includes('кусачки')) return <Scissors className="h-8 w-8" />;
    if (name.includes('замок') || name.includes('безопасн')) return <Lock className="h-8 w-8" />;
    if (name.includes('расходн') || name.includes('комплект')) return <ShoppingCart className="h-8 w-8" />;
    
    return <Bolt className="h-8 w-8" />;
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
            {/* Animated Icon Container */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${colorClass}/10 to-${colorClass}/20 flex items-center justify-center mx-auto mb-4 text-${colorClass} group-hover:from-${colorClass} group-hover:to-${colorClass}/80 group-hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl`}>
              {getIcon()}
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