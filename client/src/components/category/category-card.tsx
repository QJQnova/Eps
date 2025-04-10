import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@shared/schema";
import { Drill, Hammer, Ruler, HardHat, Bolt } from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Map category icon to Lucide icon component
  const getIcon = () => {
    switch (category.icon) {
      case "drill":
        return <Drill className="h-8 w-8" />;
      case "hammer":
        return <Hammer className="h-8 w-8" />;
      case "ruler-combined":
        return <Ruler className="h-8 w-8" />;
      case "hard-hat":
        return <HardHat className="h-8 w-8" />;
      default:
        return <Bolt className="h-8 w-8" />;
    }
  };

  // Переводим названия категорий на русский язык
  const getCategoryNameInRussian = (englishName: string) => {
    const translations: Record<string, string> = {
      "Power Tools": "Электроинструменты",
      "Hand Tools": "Ручные инструменты",
      "Measuring Tools": "Измерительные приборы",
      "Safety Equipment": "Средства защиты",
      "Workshop Equipment": "Оборудование для мастерской",
      "Garden Tools": "Садовые инструменты",
      "Plumbing Tools": "Сантехнические инструменты",
      "Electrical Tools": "Электрические инструменты"
    };
    return translations[englishName] || englishName;
  };
  
  // Определим цвет категории на основе ее названия
  const getCategoryColor = () => {
    const colors = ["eps-orange", "eps-red", "eps-yellow"];
    const index = Math.abs(category.id) % 3; // используем ID для определения цвета
    return colors[index];
  };
  
  const colorClass = getCategoryColor();
  const rusName = getCategoryNameInRussian(category.name);
  
  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200 group border-t-4 border-t-transparent hover:border-t-[color:var(--color-eps-orange)]">
        <CardContent className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full bg-${colorClass}/10 flex items-center justify-center mx-auto mb-4 text-${colorClass} group-hover:bg-${colorClass} group-hover:text-white transition duration-200`}>
            {getIcon()}
          </div>
          <h3 className="font-medium text-gray-900">{rusName}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {category.productCount || 0} {category.productCount === 1 ? 'товар' : 
             (category.productCount && category.productCount >= 2 && category.productCount <= 4) ? 'товара' : 'товаров'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
