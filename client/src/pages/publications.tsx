// Удалены импорты Header и Footer, так как они подключаются в App.tsx
import { Helmet } from 'react-helmet';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Calendar, User, Clock, Bookmark, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Publications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [publications, setPublications] = useState([]);

  const mockPublications = [
    {
      id: 1,
      title: "Новые технологии в буровых работах",
      excerpt: "Обзор современных технологий и оборудования для буровых работ...",
      date: "2024-01-15",
      author: "Инженер Петров",
      readTime: "5 мин",
      category: "Технологии"
    },
    {
      id: 2,
      title: "Безопасность на буровых площадках",
      excerpt: "Важные аспекты обеспечения безопасности при проведении буровых работ...",
      date: "2024-01-10",
      author: "Специалист Иванов",
      readTime: "8 мин",
      category: "Безопасность"
    }
  ];

  useEffect(() => {
    setPublications(mockPublications);
  }, []);

  const filteredPublications = publications.filter(pub =>
    pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Публикации - Каталог буровых инструментов</title>
        <meta name="description" content="Статьи и публикации о буровых инструментах и технологиях" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Публикации</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Статьи, обзоры и новости о буровых инструментах и технологиях
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Поиск публикаций..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Publications Grid */}
        <ScrollArea className="h-[600px]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPublications.map((publication) => (
              <div key={publication.id} className="bg-card rounded-lg border p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {publication.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                  {publication.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {publication.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{publication.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{publication.readTime}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(publication.date).toLocaleDateString('ru-RU')}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="group">
                    Читать
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {filteredPublications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Публикации не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}ut";

// Имитация данных для страницы
const ARTICLES = [
  {
    id: 1,
    title: "Как выбрать дрель для домашнего использования",
    excerpt: "Рассматриваем основные характеристики бытовых дрелей и даем советы по выбору инструмента для домашних работ.",
    category: "Советы",
    cover: "/img/article-drill.jpg",
    author: "Алексей Петров",
    date: "15 апреля 2025",
    readTime: "8 мин"
  },
  {
    id: 2,
    title: "Обзор новых моделей перфораторов 2025 года",
    excerpt: "Представляем обзор самых новых и технологичных моделей перфораторов, появившихся на рынке в этом году.",
    category: "Обзоры",
    cover: "/img/article-perforator.jpg",
    author: "Иван Сидоров",
    date: "10 апреля 2025",
    readTime: "12 мин"
  },
  {
    id: 3,
    title: "Техника безопасности при работе с электроинструментом",
    excerpt: "Важные правила безопасности, которые необходимо соблюдать при работе с любым электрическим инструментом.",
    category: "Безопасность",
    cover: "/img/article-safety.jpg",
    author: "Елена Кузнецова",
    date: "5 апреля 2025",
    readTime: "10 мин"
  },
  {
    id: 4,
    title: "Как продлить срок службы аккумуляторных инструментов",
    excerpt: "Практические советы по правильному использованию и обслуживанию аккумуляторных инструментов.",
    category: "Советы",
    cover: "/img/article-battery.jpg",
    author: "Дмитрий Козлов",
    date: "1 апреля 2025",
    readTime: "7 мин"
  },
  {
    id: 5,
    title: "Сравнение профессиональных и бытовых шуруповертов",
    excerpt: "Анализируем различия между профессиональными и бытовыми моделями шуруповертов, их преимущества и недостатки.",
    category: "Сравнения",
    cover: "/img/article-screwdriver.jpg",
    author: "Анна Соколова",
    date: "28 марта 2025",
    readTime: "9 мин"
  },
  {
    id: 6,
    title: "Новинки строительных инструментов на выставке СтройЭкспо 2025",
    excerpt: "Отчет с международной выставки строительных инструментов и обзор самых интересных новинок.",
    category: "Новости",
    cover: "/img/article-expo.jpg",
    author: "Сергей Белов",
    date: "25 марта 2025",
    readTime: "15 мин"
  }
];

const NEWS = [
  {
    id: 1,
    title: "Открытие нового магазина ЭПС в торговом центре «Мегаполис»",
    date: "12 апреля 2025"
  },
  {
    id: 2,
    title: "ЭПС стал официальным дилером бренда HiTech Tools",
    date: "8 апреля 2025"
  },
  {
    id: 3,
    title: "График работы магазинов ЭПС в майские праздники",
    date: "5 апреля 2025"
  },
  {
    id: 4,
    title: "Расширение ассортимента садовой техники",
    date: "1 апреля 2025"
  }
];

// Функция для определения цвета категории
const getCategoryColor = (category: string) => {
  switch (category) {
    case "Обзоры":
      return "bg-blue-100 text-blue-700";
    case "Советы":
      return "bg-green-100 text-green-700";
    case "Безопасность":
      return "bg-red-100 text-red-700";
    case "Сравнения":
      return "bg-purple-100 text-purple-700";
    case "Новости":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function PublicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArticles, setFilteredArticles] = useState(ARTICLES);
  
  // Прокрутка вверх страницы при загрузке
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Фильтрация статей при поиске
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setFilteredArticles(ARTICLES);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = ARTICLES.filter(article => 
      article.title.toLowerCase().includes(query) || 
      article.excerpt.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    );
    
    setFilteredArticles(filtered);
  };

  return (
    <>
      <Helmet>
        <title>Публикации | ЭПС</title>
        <meta name="description" content="Обзоры, советы, новости и полезная информация об инструментах и оборудовании от компании ЭПС" />
      </Helmet>

      {/* Хедер удален, так как он добавляется в App.tsx */}
      
      <main className="min-h-screen pt-8 pb-16">
        <div className="container px-4 mx-auto">
          {/* Заголовок и поиск */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Публикации</h1>
              <p className="text-lg text-gray-600">
                Обзоры, советы и полезная информация
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="w-full md:w-auto">
              <div className="relative max-w-sm">
                <Input 
                  type="text"
                  placeholder="Поиск статей..."
                  className="pr-10 border-gray-200 focus:border-eps-red focus:ring-eps-red"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-eps-red transition-colors"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-3/4">
              {/* Основные статьи */}
              <div className="grid gap-8 md:grid-cols-2">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                    <div className="relative h-52 overflow-hidden">
                      <img 
                        src={article.cover} 
                        alt={article.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.src = '';
                        }}
                      />
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                    </div>
                    <div className="p-5 flex-grow">
                      <h3 className="text-xl font-semibold mb-3 hover:text-eps-red transition-colors">
                        <a href={`/publication/${article.id}`}>{article.title}</a>
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>{article.author}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{article.date}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 pb-5 mt-auto">
                      <Button variant="outline" className="w-full border-eps-red text-eps-red hover:bg-red-50 transition-colors">
                        Читать полностью <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Если ничего не найдено */}
              {filteredArticles.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-4">По вашему запросу ничего не найдено</p>
                  <Button 
                    variant="outline"
                    className="border-eps-red text-eps-red hover:bg-red-50"
                    onClick={() => {
                      setSearchQuery("");
                      setFilteredArticles(ARTICLES);
                    }}
                  >
                    Сбросить поиск
                  </Button>
                </div>
              )}
              
              {/* Пагинация */}
              {filteredArticles.length > 0 && (
                <div className="flex justify-center mt-10">
                  <nav className="flex space-x-2">
                    <Button variant="outline" className="px-4 border-gray-200" disabled>
                      &laquo;
                    </Button>
                    <Button variant="outline" className="px-4 border-gray-200 bg-eps-red text-white">
                      1
                    </Button>
                    <Button variant="outline" className="px-4 border-gray-200">
                      2
                    </Button>
                    <Button variant="outline" className="px-4 border-gray-200">
                      3
                    </Button>
                    <Button variant="outline" className="px-4 border-gray-200">
                      &raquo;
                    </Button>
                  </nav>
                </div>
              )}
            </div>
            
            {/* Боковая панель */}
            <div className="lg:w-1/4">
              {/* Категории */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-8">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Категории</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="flex items-center justify-between text-gray-700 hover:text-eps-red transition-colors">
                      <span>Обзоры</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">8</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center justify-between text-gray-700 hover:text-eps-red transition-colors">
                      <span>Советы</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">12</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center justify-between text-gray-700 hover:text-eps-red transition-colors">
                      <span>Новости</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">5</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center justify-between text-gray-700 hover:text-eps-red transition-colors">
                      <span>Безопасность</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">4</span>
                    </a>
                  </li>
                  <li>
                    <a href="#" className="flex items-center justify-between text-gray-700 hover:text-eps-red transition-colors">
                      <span>Сравнения</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">6</span>
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Последние новости */}
              <div className="bg-white rounded-xl shadow-md p-5 mb-8">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Последние новости</h3>
                <ul className="space-y-4">
                  {NEWS.map((news) => (
                    <li key={news.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <a href="#" className="group">
                        <h4 className="text-gray-700 font-medium group-hover:text-eps-red transition-colors">
                          {news.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{news.date}</span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-4 border-gray-200">
                  Все новости
                </Button>
              </div>
              
              {/* Подписка */}
              <div className="bg-gray-50 rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Bookmark className="h-6 w-6 text-eps-red" />
                  <h3 className="text-lg font-semibold">Подписка на рассылку</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Получайте уведомления о новых статьях и обзорах прямо на вашу почту
                </p>
                <div className="space-y-3">
                  <Input 
                    type="email" 
                    placeholder="Ваш email" 
                    className="bg-white border-gray-200"
                  />
                  <Button className="w-full bg-gradient-to-r from-eps-red to-red-700 hover:from-red-700 hover:to-eps-red text-white">
                    Подписаться
                  </Button>
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