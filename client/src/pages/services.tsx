import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from 'react-helmet';
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Wrench, Truck, Package, Shield, CircleDollarSign, Clock } from "lucide-react";

export default function ServicesPage() {
  // Прокрутка вверх страницы при загрузке
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Услуги | ЭПС</title>
        <meta name="description" content="Профессиональные услуги от компании ЭПС: ремонт, обслуживание, доставка и аренда инструмента" />
      </Helmet>

      <Header />
      
      <main className="min-h-screen pt-8 pb-16">
        <div className="container px-4 mx-auto">
          {/* Заголовок страницы */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Услуги компании ЭПС</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Мы предлагаем широкий спектр профессиональных услуг для наших клиентов
            </p>
          </div>
          
          {/* Список услуг */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Ремонт инструмента */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-eps-red to-red-700 p-4 text-white">
                <Wrench className="h-8 w-8 mb-2" />
                <h3 className="text-xl font-semibold">Ремонт инструмента</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Профессиональный ремонт инструментов любой сложности. Наши специалисты быстро вернут ваш инструмент в рабочее состояние.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Диагностика неисправностей
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Замена деталей
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Гарантия на выполненные работы
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                  Подробнее
                </Button>
              </div>
            </div>
            
            {/* Аренда инструмента */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-eps-red to-red-700 p-4 text-white">
                <Package className="h-8 w-8 mb-2" />
                <h3 className="text-xl font-semibold">Аренда инструмента</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Предлагаем в аренду профессиональный инструмент для решения любых задач. Выгодные условия и широкий ассортимент.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Гибкие сроки аренды
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Доставка до объекта
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Техническая поддержка
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                  Подробнее
                </Button>
              </div>
            </div>
            
            {/* Доставка */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-eps-red to-red-700 p-4 text-white">
                <Truck className="h-8 w-8 mb-2" />
                <h3 className="text-xl font-semibold">Доставка</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Быстрая доставка инструментов и оборудования в любую точку города и области. Удобное время и надежность.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Доставка в день заказа
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Отслеживание заказа
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Бережная транспортировка
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                  Подробнее
                </Button>
              </div>
            </div>
            
            {/* Обслуживание */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-eps-red to-red-700 p-4 text-white">
                <Shield className="h-8 w-8 mb-2" />
                <h3 className="text-xl font-semibold">Техническое обслуживание</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Регулярное техническое обслуживание инструментов и оборудования. Продлите срок службы вашей техники.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Профилактические осмотры
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Калибровка и настройка
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Сервисные контракты
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                  Подробнее
                </Button>
              </div>
            </div>
            
            {/* Консультации */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-eps-red to-red-700 p-4 text-white">
                <CircleDollarSign className="h-8 w-8 mb-2" />
                <h3 className="text-xl font-semibold">Оценка и выкуп</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Предлагаем услуги по оценке и выкупу б/у инструмента. Справедливая цена и прозрачные условия.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Бесплатная диагностика
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Выгодные цены
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Быстрая оплата
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                  Подробнее
                </Button>
              </div>
            </div>
            
            {/* Срочный ремонт */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-gradient-to-r from-eps-red to-red-700 p-4 text-white">
                <Clock className="h-8 w-8 mb-2" />
                <h3 className="text-xl font-semibold">Срочный ремонт</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Экспресс-ремонт инструментов в кратчайшие сроки. Когда нет времени ждать, доверьтесь нашим мастерам.
                </p>
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Ремонт за 24 часа
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Приоритетное обслуживание
                  </li>
                  <li className="flex items-center">
                    <span className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-eps-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Экспресс-доставка
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                  Подробнее
                </Button>
              </div>
            </div>
          </div>
          
          {/* Форма обратной связи */}
          <div className="mt-16 p-8 bg-gray-50 rounded-xl shadow-inner">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-2/3">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Получите бесплатную консультацию</h2>
                <p className="text-gray-600 mb-6">
                  Оставьте свои контактные данные, и наши специалисты свяжутся с вами для консультации по услугам компании ЭПС.
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Ваше имя" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <input 
                      type="tel" 
                      placeholder="Ваш телефон" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <textarea 
                    placeholder="Ваш вопрос или комментарий" 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  ></textarea>
                  <Button className="w-full md:w-auto bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                    Отправить запрос
                  </Button>
                </div>
              </div>
              
              <div className="md:w-1/3 flex justify-center">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                  <svg className="w-16 h-16 md:w-24 md:h-24 text-eps-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}