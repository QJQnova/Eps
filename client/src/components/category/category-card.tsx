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
  
  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-200 group">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:bg-primary group-hover:text-white transition duration-200">
            {getIcon()}
          </div>
          <h3 className="font-medium text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
