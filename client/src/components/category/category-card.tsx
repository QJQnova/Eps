import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@shared/schema";
import { 
  Drill, 
  Hammer, 
  Ruler, 
  HardHat, 
  Bolt, 
  Cable, 
  TreePine, 
  Wrench, 
  Gauge, 
  Cog, 
  Flame, 
  Droplet, 
  Activity, 
  BatteryCharging, 
  Cloud, 
  Zap, 
  Target,
  Building
} from "lucide-react";

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
      case "power":
        return <Cable className="h-8 w-8" />;
      case "tree":
        return <TreePine className="h-8 w-8" />;
      case "flash":
        return <Wrench className="h-8 w-8" />;
      case "gauge":
        return <Gauge className="h-8 w-8" />;
      case "cog":
        return <Cog className="h-8 w-8" />;
      case "fire":
        return <Flame className="h-8 w-8" />;
      case "droplet":
        return <Droplet className="h-8 w-8" />;
      case "activity":
        return <Activity className="h-8 w-8" />;
      case "battery-charging":
        return <BatteryCharging className="h-8 w-8" />;
      case "cloud-snow":
        return <Cloud className="h-8 w-8" />;
      case "zap":
        return <Zap className="h-8 w-8" />;
      case "crosshair":
        return <Target className="h-8 w-8" />;
      case "construction":
        return <Building className="h-8 w-8" />;
      default:
        return <Bolt className="h-8 w-8" />;
    }
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
