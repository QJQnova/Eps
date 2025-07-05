import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Получаем изображение товара для категории из нашего каталога
  const getCategoryImage = () => {
    const name = category.name.toLowerCase();
    
    // Используем изображения наших товаров для каждой категории
    if (name.includes('аккумулятор') || name.includes('батарея')) {
      return `/images/products/LB1220-1.png`; // Аккумулятор DCK
    }
    if (name.includes('дрель')) {
      return `/images/products/KJZ06-13.png`; // Дрель
    }
    if (name.includes('шуруповерт')) {
      return `/images/products/KJZ07-13.png`; // Шуруповерт
    }
    if (name.includes('перфоратор')) {
      return `/images/products/KJZ08-10.png`; // Перфоратор
    }
    if (name.includes('гайковерт')) {
      return `/images/products/KJZ10-10.png`; // Гайковерт
    }
    if (name.includes('шлифовальн') && name.includes('угловые')) {
      return `/images/products/KJG04-355BS.png`; // Болгарка/УШМ
    }
    if (name.includes('лобзик')) {
      return `/images/products/KJF02-30.png`; // Лобзик
    }
    if (name.includes('пила') && name.includes('дисков')) {
      return `/images/products/KJX03-255.png`; // Дисковая пила
    }
    if (name.includes('пила') && name.includes('сабельн')) {
      return `/images/products/KJX06-255.png`; // Сабельная пила
    }
    if (name.includes('пила') && name.includes('цепн')) {
      return `/images/products/KJC02-30.png`; // Цепная пила
    }
    if (name.includes('миксер')) {
      return `/images/products/KMB03-82.png`; // Миксер
    }
    if (name.includes('зарядн')) {
      return `/images/products/FFBL2020.png`; // Зарядное устройство
    }
    if (name.includes('воздуходувк')) {
      return `/images/products/KMB110.png`; // Воздуходувка
    }
    if (name.includes('шлифовальн') && name.includes('ленточн')) {
      return `/images/products/KSA02-125.png`; // Ленточная шлифмашина
    }
    if (name.includes('шлифовальн') && name.includes('плоск')) {
      return `/images/products/KSF02-180.png`; // Плоскошлифовальная машина
    }
    if (name.includes('шлифовальн') && name.includes('эксцентрик')) {
      return `/images/products/KSB02-100.png`; // Эксцентриковая шлифмашина
    }
    if (name.includes('отбойн')) {
      return `/images/products/KDPB358(TYPE FK).png`; // Отбойный молоток
    }
    if (name.includes('штроборез')) {
      return `/images/products/KDZC04-24(TYPE FK).png`; // Штроборез
    }
    if (name.includes('рубанок')) {
      return `/images/products/KDPL04-8(TYPE EK).png`; // Рубанок
    }
    if (name.includes('фрезер')) {
      return `/images/products/KDPM50(TYPE EK).png`; // Фрезер
    }
    if (name.includes('фен')) {
      return `/images/products/KMD320.png`; // Фен технический
    }
    if (name.includes('станок') && name.includes('сверлильн')) {
      return `/images/products/KDSP02-180(TYPE FK).png`; // Сверлильный станок
    }
    if (name.includes('набор')) {
      return `/images/products/KMY02-235.png`; // Набор инструментов
    }
    if (name.includes('шприц')) {
      return `/images/products/KDMY125(TYPE FK).png`; // Шприц для смазки
    }
    if (name.includes('алмазн')) {
      return `/images/products/KDSJ10(TYPE EK).png`; // Алмазная дрель
    }
    if (name.includes('торцовочн')) {
      return `/images/products/KDSM03-125(TYPE FK).png`; // Торцовочная пила
    }
    if (name.includes('отрезн')) {
      return `/images/products/KDSM04-125(TYPE FK).png`; // Отрезная пила
    }
    
    // По умолчанию - универсальный инструмент
    return `/images/products/KJZ06-13K.png`;
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
            <div className={`w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl`}>
              <img 
                src={getCategoryImage()} 
                alt={category.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Попробуем загрузить универсальное изображение
                  const target = e.currentTarget;
                  if (!target.src.includes('KJZ06-13K.png')) {
                    target.src = '/images/products/KJZ06-13K.png';
                  } else {
                    // Если и универсальное изображение не загружается, используем цветной фон
                    target.style.display = 'none';
                    target.parentElement!.className += ` bg-gradient-to-br from-${colorClass}/10 to-${colorClass}/20`;
                  }
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