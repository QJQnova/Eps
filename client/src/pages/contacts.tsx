import { Helmet } from "react-helmet";
import { MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Имитация отправки формы
    setTimeout(() => {
      toast({
        title: "Сообщение отправлено",
        description: "Спасибо! Мы свяжемся с вами в ближайшее время.",
        variant: "default"
      });
      
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setLoading(false);
    }, 1000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Helmet>
        <title>Контакты | ЭПС</title>
        <meta name="description" content="Свяжитесь с нами для получения информации о продукции, ценах и доставке. Мы всегда рады помочь вам с выбором профессиональных инструментов." />
      </Helmet>
      
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Контакты</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Информация о контактах */}
          <div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-eps-red">Волгоград</h2>
                
                <div className="space-y-4">
                  <div className="flex">
                    <MapPin className="h-5 w-5 text-eps-red mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-700">г. Волгоград, улица им Маршала Еременко, дом 44</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Phone className="h-5 w-5 text-eps-red mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-700">+7 929 780-48-46</p>
                      <p className="text-gray-500 text-sm">Бесплатная линия: 8 800 101 38 35</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Mail className="h-5 w-5 text-eps-red mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-700">info@eps.su</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <p className="font-medium text-gray-700 mb-2">Режим работы:</p>
                    <p className="text-gray-600">Пн. - Пт.: 8:00 - 18:00</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-eps-red">Филиалы</h2>
                
                <div className="space-y-5">
                  <div className="pb-3 border-b border-gray-100">
                    <p className="font-medium text-gray-800">г. Ростов-на-Дону</p>
                    <p className="text-gray-600 mb-1">проспект Королёва, 1Э</p>
                    <p className="text-gray-600">Тел.: +7 960 444-75-95</p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100">
                    <p className="font-medium text-gray-800">г. Санкт-Петербург</p>
                    <p className="text-gray-600 mb-1">проспект Железнодорожный 14 к7</p>
                    <p className="text-gray-600">Тел.: +7 981 858-21-43</p>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-100">
                    <p className="font-medium text-gray-800">г. Новороссийск</p>
                    <p className="text-gray-600 mb-1">село Гайдук улица Строительная дом 14</p>
                    <p className="text-gray-600">Тел.: +7 918 120-85-55</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-800">г. Мариуполь</p>
                    <p className="text-gray-600 mb-1">ул. Соборная, д. 10</p>
                    <p className="text-gray-600">Тел.: +7 949 023-20-77</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Форма обратной связи */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-eps-red">Связаться с нами</h2>
              <p className="text-gray-600 mb-6">
                Заполните форму, и наш специалист свяжется с вами в ближайшее время для консультации или ответа на ваши вопросы.
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Ваше имя
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-gray-300 focus:border-eps-red focus:ring-eps-red"
                      placeholder="Введите ваше имя"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-300 focus:border-eps-red focus:ring-eps-red"
                      placeholder="Введите ваш email"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-gray-300 focus:border-eps-red focus:ring-eps-red"
                      placeholder="Введите ваш телефон"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Сообщение
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border-gray-300 focus:border-eps-red focus:ring-eps-red min-h-[100px]"
                      placeholder="Опишите ваш вопрос или запрос"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-eps-red hover:bg-red-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <span className="mr-2">Отправка</span>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </div>
                    ) : (
                      "Отправить сообщение"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Карта</h2>
        <div className="bg-gray-100 rounded-xl h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Интерактивная карта с местоположением магазинов</p>
            <p className="text-sm text-gray-400">Для загрузки полной карты нажмите на эту область</p>
          </div>
        </div>
      </div>
    </div>
  );
}