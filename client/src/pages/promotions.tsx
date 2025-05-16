// Удалены импорты Header и Footer, так как они подключаются в App.tsx
import { Helmet } from 'react-helmet';
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Calendar, Tag, Percent } from "lucide-react";

export default function PromotionsPage() {
  // Прокрутка вверх страницы при загрузке
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Акции и спецпредложения | ЭПС</title>
        <meta name="description" content="Выгодные акции и специальные предложения на инструменты и оборудование от компании ЭПС" />
      </Helmet>

      {/* Хедер удален, так как он добавляется в App.tsx */}
      
      <main className="min-h-screen pt-8 pb-16">
        <div className="container px-4 mx-auto">
          {/* Заголовок страницы */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Акции и спецпредложения</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Ознакомьтесь с нашими текущими акциями и специальными предложениями на профессиональные инструменты и оборудование
            </p>
          </div>
          
          {/* Главная акция */}
          <div className="relative overflow-hidden rounded-2xl shadow-xl mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-eps-red/80 to-red-700/80 z-10"></div>
            <div className="absolute inset-0 bg-[url('/img/tools-background.jpg')] bg-cover bg-center"></div>
            <div className="relative z-20 p-8 md:p-12 text-white">
              <span className="inline-block bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                Специальное предложение
              </span>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Скидка 15% на электроинструменты</h2>
              <p className="text-white/90 text-lg mb-6 max-w-2xl">
                Только до конца месяца! Успейте приобрести профессиональные электроинструменты со скидкой 15%. 
                Предложение распространяется на весь ассортимент электроинструментов.
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>До 30 апреля 2025</span>
                </div>
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  <span>Код акции: TOOL15</span>
                </div>
              </div>
              <Button className="bg-white text-eps-red hover:bg-gray-100 font-medium">
                Перейти к товарам
              </Button>
            </div>
          </div>
          
          {/* Список текущих акций */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {/* Акция 1 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <img 
                  src="/img/promo-drill.jpg" 
                  alt="Дрели со скидкой" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.src = '';
                  }}
                />
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  -20%
                </div>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-xl font-semibold mb-2">Скидка на дрели</h3>
                <p className="text-gray-600 mb-4">
                  Приобретайте профессиональные дрели со скидкой 20%. Широкий выбор моделей для любых задач.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Действует до 15.05.2025</span>
                </div>
              </div>
              <div className="px-5 pb-5 mt-auto">
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-600 hover:to-eps-red text-white">
                  Посмотреть
                </Button>
              </div>
            </div>
            
            {/* Акция 2 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <img 
                  src="/img/promo-set.jpg" 
                  alt="Комплекты инструментов" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.src = '';
                  }}
                />
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  3+1
                </div>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-xl font-semibold mb-2">Четвертый инструмент в подарок</h3>
                <p className="text-gray-600 mb-4">
                  При покупке трех инструментов из специальной коллекции, четвертый инструмент вы получаете бесплатно.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Действует до 01.06.2025</span>
                </div>
              </div>
              <div className="px-5 pb-5 mt-auto">
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-600 hover:to-eps-red text-white">
                  Посмотреть
                </Button>
              </div>
            </div>
            
            {/* Акция 3 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <img 
                  src="/img/promo-service.jpg" 
                  alt="Сервисное обслуживание" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.src = '';
                  }}
                />
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  -30%
                </div>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-xl font-semibold mb-2">Скидка на сервисное обслуживание</h3>
                <p className="text-gray-600 mb-4">
                  Закажите сервисное обслуживание или ремонт инструмента со скидкой 30% при предъявлении карты клиента.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Действует до 30.06.2025</span>
                </div>
              </div>
              <div className="px-5 pb-5 mt-auto">
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-600 hover:to-eps-red text-white">
                  Посмотреть
                </Button>
              </div>
            </div>
            
            {/* Акция 4 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <img 
                  src="/img/promo-new-clients.jpg" 
                  alt="Для новых клиентов" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.src = '';
                  }}
                />
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  -10%
                </div>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-xl font-semibold mb-2">Скидка новым клиентам</h3>
                <p className="text-gray-600 mb-4">
                  Совершите первую покупку в нашем магазине и получите скидку 10% на весь ассортимент.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Бессрочная акция</span>
                </div>
              </div>
              <div className="px-5 pb-5 mt-auto">
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-600 hover:to-eps-red text-white">
                  Посмотреть
                </Button>
              </div>
            </div>
            
            {/* Акция 5 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <img 
                  src="/img/promo-delivery.jpg" 
                  alt="Бесплатная доставка" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.src = '';
                  }}
                />
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  0 ₽
                </div>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-xl font-semibold mb-2">Бесплатная доставка</h3>
                <p className="text-gray-600 mb-4">
                  При заказе от 5000 рублей доставка по городу осуществляется бесплатно. Быстро и удобно.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Постоянное предложение</span>
                </div>
              </div>
              <div className="px-5 pb-5 mt-auto">
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-600 hover:to-eps-red text-white">
                  Посмотреть
                </Button>
              </div>
            </div>
            
            {/* Акция 6 */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <img 
                  src="/img/promo-bonus.jpg" 
                  alt="Бонусная программа" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.src = '';
                  }}
                />
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  5%
                </div>
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-xl font-semibold mb-2">Бонусная программа</h3>
                <p className="text-gray-600 mb-4">
                  Получайте 5% от суммы покупки в виде бонусов, которыми можно оплатить до 50% стоимости следующих покупок.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Постоянное предложение</span>
                </div>
              </div>
              <div className="px-5 pb-5 mt-auto">
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-600 hover:to-eps-red text-white">
                  Посмотреть
                </Button>
              </div>
            </div>
          </div>
          
          {/* Баннер подписки */}
          <div className="bg-gray-50 rounded-xl p-8 md:p-12 shadow-inner">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-2/3">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Подпишитесь на рассылку акций</h2>
                <p className="text-gray-600 mb-6">
                  Оставьте свой email, чтобы первыми узнавать о новых акциях и спецпредложениях магазина ЭПС.
                  Мы не отправляем спам и не передаем ваши данные третьим лицам.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="Ваш email" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button className="bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                    Подписаться
                  </Button>
                </div>
              </div>
              <div className="md:w-1/3 flex justify-center">
                <div className="flex items-center justify-center w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <Percent className="w-16 h-16 md:w-24 md:h-24 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer удален, так как он добавляется в App.tsx */}
    </>
  );
}