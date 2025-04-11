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
      <Card className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-500 group border-t-4 border-t-transparent hover:border-t-[color:var(--color-eps-orange)] hover:translate-y-[-4px] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[color:var(--color-eps-orange)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
        <CardContent className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full bg-${colorClass}/10 flex items-center justify-center mx-auto mb-4 text-${colorClass} group-hover:bg-${colorClass} group-hover:text-white transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3 shadow-md`}>
            {getIcon()}
          </div>
          <h3 className="font-medium text-gray-900 transition-colors duration-300 group-hover:text-primary">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700 transition-colors duration-300">
            {category.productCount || 0} {category.productCount === 1 ? 'товар' : 
             (category.productCount && category.productCount >= 2 && category.productCount <= 4) ? 'товара' : 'товаров'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
