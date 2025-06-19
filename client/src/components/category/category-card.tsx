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
  // Получаем иконку для категории
  const getIcon = () => {
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
      <Card className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200 group border-t-4 border-t-transparent hover:border-t-[color:var(--color-eps-orange)]">
        <CardContent className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full bg-${colorClass}/10 flex items-center justify-center mx-auto mb-4 text-${colorClass} group-hover:bg-${colorClass} group-hover:text-white transition duration-200`}>
            {getIcon()}
          </div>
          <h3 className="font-medium text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {category.productCount || 0} {category.productCount === 1 ? 'товар' : 
             (category.productCount && category.productCount >= 2 && category.productCount <= 4) ? 'товара' : 'товаров'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}