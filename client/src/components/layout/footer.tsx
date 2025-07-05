import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  MapPin, 
  Clock, 
  Mail, 
  Settings, 
  Truck, 
  Shield, 
  Star,
  Wrench,
  Zap,
  Leaf
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.slice(0, 5)); // Показываем только первые 5 категорий
        }
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, you would send this to your API
    toast({
      title: "Подписка на новости",
      description: `Вы успешно подписались с адресом: ${email}`,
    });
    
    setEmail("");
  };
  
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      {/* Decorative top border */}
      <div className="bg-eps-gradient h-3"></div>
      
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-eps-gradient rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-eps-gradient bg-clip-text text-transparent">ЭПС</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Надежный поставщик профессиональных инструментов и оборудования для строительства и производства.
              </p>
            </div>
            
            {/* Contact info with icons */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-eps-orange mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Звоните нам:</p>
                  <a href="tel:88001013835" className="text-eps-orange text-lg font-bold hover:text-orange-400 transition">
                    8 800 101 38 35
                  </a>
                  <p className="text-gray-400 text-xs">Бесплатно по России</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-eps-yellow mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Режим работы:</p>
                  <p className="text-gray-400 text-sm">пн–пт 8:00–18:00</p>
                  <p className="text-gray-400 text-sm">сб, вс — выходные</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-eps-red mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">Email:</p>
                  <a href="mailto:info@eps.su" className="text-eps-red hover:text-red-400 transition text-sm">
                    info@eps.su
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Catalog */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Zap className="w-5 h-5 text-eps-orange" />
              <h4 className="text-lg font-semibold text-eps-orange">Каталог товаров</h4>
            </div>
            <ul className="space-y-3">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className="flex items-center space-x-2 text-gray-400 hover:text-eps-orange transition duration-200 group">
                    <span className="w-2 h-2 bg-eps-orange rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                    <span>{category.name}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="flex items-center space-x-2 text-gray-400 hover:text-eps-orange transition duration-200 group">
                  <span className="w-2 h-2 bg-eps-orange rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                  <span>Все товары</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Shield className="w-5 h-5 text-eps-red" />
              <h4 className="text-lg font-semibold text-eps-red">Обслуживание</h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="flex items-center space-x-2 text-gray-400 hover:text-eps-red transition duration-200 group">
                  <span className="w-2 h-2 bg-eps-red rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                  <span>Связаться с нами</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="flex items-center space-x-2 text-gray-400 hover:text-eps-red transition duration-200 group">
                  <span className="w-2 h-2 bg-eps-red rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                  <span>Частые вопросы</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="flex items-center space-x-2 text-gray-400 hover:text-eps-red transition duration-200 group">
                  <span className="w-2 h-2 bg-eps-red rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                  <span>Доставка и оплата</span>
                </Link>
              </li>
              <li>
                <Link href="/returns" className="flex items-center space-x-2 text-gray-400 hover:text-eps-red transition duration-200 group">
                  <span className="w-2 h-2 bg-eps-red rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                  <span>Возврат и обмен</span>
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="flex items-center space-x-2 text-gray-400 hover:text-eps-red transition duration-200 group">
                  <span className="w-2 h-2 bg-eps-red rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                  <span>Гарантийное обслуживание</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Star className="w-5 h-5 text-eps-yellow" />
              <h4 className="text-lg font-semibold text-eps-yellow">Новости и акции</h4>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                Подпишитесь на рассылку и первыми узнавайте о новинках, скидках и специальных предложениях.
              </p>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Ваш email адрес"
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:border-eps-yellow focus:ring-eps-yellow/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-eps-gradient hover:opacity-90 text-white font-medium py-2.5 transition-all duration-200 hover:shadow-lg"
                >
                  Подписаться на новости
                </Button>
              </form>
              <p className="text-xs text-gray-400 mt-3">
                Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
              </p>
            </div>
          </div>
        </div>
        
        {/* Addresses section */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <div className="flex items-center space-x-2 mb-6">
            <MapPin className="w-5 h-5 text-eps-orange" />
            <h4 className="text-lg font-semibold text-white">Наши адреса</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "г. Волгоград, ул. им. Маршала Еременко, д. 44",
              "г. Ростов-на-Дону, проспект Королёва, д. 1Э",
              "г. Санкт-Петербург, проспект Железнодорожный, д. 14 к7",
              "г. Новороссийск, с. Гайдук, ул. Строительная д. 14",
              "г. Мариуполь, ул. Соборная, д. 10"
            ].map((address, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                <MapPin className="w-4 h-4 text-eps-orange mt-1 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{address}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Features section */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg">
              <Truck className="w-8 h-8 text-eps-orange" />
              <div>
                <h5 className="text-white font-medium">Быстрая доставка</h5>
                <p className="text-gray-400 text-sm">По всей России</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg">
              <Shield className="w-8 h-8 text-eps-yellow" />
              <div>
                <h5 className="text-white font-medium">Гарантия качества</h5>
                <p className="text-gray-400 text-sm">На все товары</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-slate-800/30 rounded-lg">
              <Settings className="w-8 h-8 text-eps-red" />
              <div>
                <h5 className="text-white font-medium">Сервисное обслуживание</h5>
                <p className="text-gray-400 text-sm">Профессиональный сервис</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-slate-700/50 flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} ЭПС. Все права защищены.</p>
            <div className="h-4 w-px bg-slate-600"></div>
            <p className="text-gray-500 text-xs">Разработано с ❤️ для профессионалов</p>
          </div>
          
          <div className="flex flex-wrap justify-center lg:justify-end gap-4 text-xs">
            <Link href="/privacy" className="text-gray-400 hover:text-eps-orange transition duration-200 px-2 py-1 rounded hover:bg-slate-800/50">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-eps-red transition duration-200 px-2 py-1 rounded hover:bg-slate-800/50">
              Пользовательское соглашение
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-eps-yellow transition duration-200 px-2 py-1 rounded hover:bg-slate-800/50">
              Политика cookies
            </Link>
            <Link href="/sitemap" className="text-gray-400 hover:text-eps-orange transition duration-200 px-2 py-1 rounded hover:bg-slate-800/50">
              Карта сайта
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative bottom pattern */}
      <div className="h-1 bg-eps-gradient"></div>
    </footer>
  );
}
