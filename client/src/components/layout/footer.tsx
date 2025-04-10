import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
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
    <footer className="bg-gray-900 text-white py-12">
      <div className="bg-eps-gradient h-2"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-eps-gradient">ЭПС</h3>
            <p className="text-gray-400 mb-4">Надежный поставщик профессиональных инструментов и оборудования.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-eps-orange transition duration-200">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-eps-red transition duration-200">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-eps-yellow transition duration-200">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-eps-orange transition duration-200">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4 text-eps-orange">Каталог</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/category/power-tools" className="text-gray-400 hover:text-eps-orange transition duration-200">
                  Электроинструменты
                </Link>
              </li>
              <li>
                <Link href="/category/hand-tools" className="text-gray-400 hover:text-eps-orange transition duration-200">
                  Ручные инструменты
                </Link>
              </li>
              <li>
                <Link href="/category/measuring-tools" className="text-gray-400 hover:text-eps-orange transition duration-200">
                  Измерительные приборы
                </Link>
              </li>
              <li>
                <Link href="/category/safety-equipment" className="text-gray-400 hover:text-eps-orange transition duration-200">
                  Средства защиты
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-eps-orange transition duration-200">
                  Все товары
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4 text-eps-red">Обслуживание клиентов</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-eps-red transition duration-200">
                  Связаться с нами
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-eps-red transition duration-200">
                  Частые вопросы
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-eps-red transition duration-200">
                  Доставка
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-eps-red transition duration-200">
                  Возврат и обмен
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-eps-red transition duration-200">
                  Условия использования
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-4 text-eps-yellow">Новости и акции</h4>
            <p className="text-gray-400 mb-4">Подпишитесь на нашу рассылку, чтобы получать информацию о новинках и скидках.</p>
            <form className="flex" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Ваш email"
                className="px-4 py-2 rounded-l-lg flex-1 text-gray-900 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                className="bg-eps-gradient hover:opacity-90 px-4 py-2 rounded-r-lg transition duration-200"
              >
                Подписаться
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} ЭПС Инструменты. Все права защищены.</p>
          <div className="mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-eps-orange text-sm mx-3 transition duration-200">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-eps-red text-sm mx-3 transition duration-200">
              Пользовательское соглашение
            </Link>
            <Link href="/cookies" className="text-gray-400 hover:text-eps-yellow text-sm mx-3 transition duration-200">
              Политика cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
