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
  Wrench
} from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Получаем иконку для категории на основе её названия
  const getIcon = () => {
    const name = category.name.toLowerCase();
    
    if (name.includes('дрель') || name.includes('сверл'))
      return <Drill className="h-8 w-8" />;
    if (name.includes('молот') || name.includes('отбойн'))
      return <Hammer className="h-8 w-8" />;
    if (name.includes('измер') || name.includes('метр'))
      return <Ruler className="h-8 w-8" />;
    if (name.includes('электр') || name.includes('питан'))
      return <Zap className="h-8 w-8" />;
    if (name.includes('давлен') || name.includes('манометр'))
      return <Gauge className="h-8 w-8" />;
    if (name.includes('кабел') || name.includes('провод'))
      return <Cable className="h-8 w-8" />;
    if (name.includes('гаечн') || name.includes('ключ'))
      return <Wrench className="h-8 w-8" />;
      
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
      <Card className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-500 group border-t-4 border-t-transparent hover:border-t-[color:var(--color-eps-orange)] hover:translate-y-[-4px] relative animate-fadeIn">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[color:var(--color-eps-orange)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 rounded-lg transform scale-90 group-hover:scale-100 transition-all duration-500"></div>
        <CardContent className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full bg-${colorClass}/10 flex items-center justify-center mx-auto mb-4 text-${colorClass} group-hover:bg-${colorClass} group-hover:text-white transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3 shadow-md relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
            <div className="relative z-10 transition-transform duration-500 transform group-hover:scale-110 group-hover:rotate-12">
              {getIcon()}
            </div>
          </div>
          <h3 className="font-medium text-gray-900 transition-all duration-300 group-hover:text-primary relative inline-block">
            {category.name}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </h3>
          <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700 transition-all duration-300 transform group-hover:translate-y-[-2px]">
            {category.productCount || 0} {category.productCount === 1 ? 'товар' : 
             (category.productCount && category.productCount >= 2 && category.productCount <= 4) ? 'товара' : 'товаров'}
          </p>
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
            <span className="text-xs font-medium text-primary">Просмотреть товары</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
