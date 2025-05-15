import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, ShoppingCart, Menu, X, ChevronDown, Package, LogIn, LogOut } from "lucide-react";
import { Category } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  
  const { itemCount } = useCart();
  const { user, logoutMutation } = useAuth();
  
  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({ 
    queryKey: ["/api/categories"]
  });
  
  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?query=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };
  
  return (
    <header className="bg-white z-30 shadow-sm border-b border-red-100">
      {/* Top bar с контактами */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-2 text-xs text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between">
            <div className="flex items-center">
              <span className="inline-block hover:text-eps-yellow transition-colors">
                Телефон: 8 800 101 38 35
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <span className="hover:text-eps-yellow transition-colors">пн. - пт.: 8:00 - 18:00</span>
            </div>
            <div className="md:hidden">
              <span className="hover:text-eps-yellow transition-colors">г. Волгоград</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Основная часть шапки с логотипом и поиском */}
      <div className="relative bg-white md:static">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Логотип с эффектами */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-eps-red to-eps-yellow group-hover:from-red-600 group-hover:to-eps-yellow transition-all duration-300">
                    ЭПС (ТЕСТ)
                  </span>
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-eps-red group-hover:w-full transition-all duration-300"></span>
                </div>
                {/* Убираем "Инструменты", оставляем только ЭПС */}
              </Link>
            </div>
            
            <div className="hidden md:flex md:flex-1 md:justify-end">
              <div className="flex items-center space-x-6">
              
                {/* Форма поиска с эффектами */}
                <form onSubmit={handleSearch} className="hidden lg:block w-96">
                  <div className="relative">
                    <Input 
                      type="text"
                      placeholder="Поиск товаров..."
                      className="pr-10 border-red-200 focus:border-eps-red focus:ring-eps-red"
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
                
                {/* Кнопки корзины, профиля и авторизации с улучшенным дизайном */}
                <div className="flex items-center space-x-6">
                  {/* Корзина (для всех пользователей) */}
                  <Link href="/cart" className="flex items-center text-gray-700 hover:text-eps-red relative group">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="p-2 bg-gray-100 rounded-full group-hover:bg-red-50 transition-colors duration-300">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        {itemCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-eps-red text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                            {itemCount}
                          </span>
                        )}
                      </div>
                      <span className="ml-2 font-medium text-sm hidden sm:block">Корзина</span>
                    </div>
                  </Link>
                  
                  {user ? (
                    // Для авторизованных пользователей - Профиль и выход
                    <>
                      <Link href="/profile" className="flex items-center text-gray-700 hover:text-orange-600 group">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-full group-hover:bg-orange-50 transition-colors duration-300">
                            <User className="h-5 w-5" />
                          </div>
                          <span className="ml-2 font-medium text-sm hidden sm:block">Профиль</span>
                        </div>
                      </Link>
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center text-gray-700 hover:text-orange-600 group"
                        disabled={logoutMutation.isPending}
                      >
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-full group-hover:bg-orange-50 transition-colors duration-300">
                            <LogOut className="h-5 w-5" />
                          </div>
                          <span className="ml-2 font-medium text-sm hidden sm:block">
                            {logoutMutation.isPending ? "Выход..." : "Выйти"}
                          </span>
                        </div>
                      </button>
                    </>
                  ) : (
                    // Для неавторизованных пользователей - только кнопка Войти
                    <Link href="/auth" className="flex items-center text-gray-700 hover:text-orange-600 group">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-full group-hover:bg-orange-50 transition-colors duration-300">
                          <LogIn className="h-5 w-5" />
                        </div>
                        <span className="ml-2 font-medium text-sm hidden sm:block">Войти</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            {/* Мобильные элементы интерфейса */}
            <div className="flex items-center space-x-4 md:hidden">
              {/* Мобильная корзина */}
              <Link href="/cart" className="text-gray-700 relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-eps-red text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>
              
              {/* Мобильная кнопка меню */}
              <Button
                variant="ghost" 
                size="icon"
                className="text-gray-700 hover:text-eps-red hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Навигационное меню с градиентным фоном */}
      <nav className="bg-gradient-to-r from-eps-red to-red-700 text-white shadow-md hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <div className="flex space-x-3">
              {/* Домашняя страница */}
              <Link href="/" className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                Главная
              </Link>
              
              {/* Услуги */}
              <Link href="/services" className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                Услуги
              </Link>
              
              {/* Акции */}
              <Link href="/promotions" className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                Акции
              </Link>
              
              {/* Публикации */}
              <Link href="/publications" className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                Публикации
              </Link>
              
              {/* Выпадающий список категорий */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                    Товары <ChevronDown className="h-4 w-4 ml-1 opacity-75" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white p-2 shadow-xl rounded-md border-orange-200 min-w-[200px]">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.id} asChild className="rounded-sm hover:bg-orange-50 focus:bg-orange-50">
                      <Link href={`/category/${category.slug}`} className="w-full p-2 text-gray-700 hover:text-orange-600">
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-orange-100" />
                  <DropdownMenuItem asChild className="rounded-sm hover:bg-orange-50 focus:bg-orange-50">
                    <Link href="/products" className="w-full p-2 text-gray-700 hover:text-orange-600 font-medium">
                      Все товары
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Ссылка на страницу контактов */}
              <Link href="/contacts" className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                Контакты
              </Link>
              
              {/* Ссылка на страницу о компании */}
              <Link href="/about" className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                О компании
              </Link>
              
              {/* Ссылка на admin-панель для администраторов */}
              {user?.role === 'admin' && (
                <Link href="/admin" className="nav-link flex items-center px-3 py-3 text-white hover:text-white hover:bg-white/10 transition-colors duration-200">
                  Админ-панель
                </Link>
              )}
            </div>
            
            {/* Поиск для десктопной версии */}
            <div className="flex items-center">
              <form onSubmit={handleSearch} className="w-64">
                <div className="relative">
                  <Input 
                    type="text"
                    placeholder="Поиск товаров..."
                    className="pr-8 h-8 bg-white/10 border-white/30 placeholder-white/70 text-white focus:bg-white/20 focus:border-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-white h-6 w-6"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Мобильное меню с обновленным дизайном */}
      <div 
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-white fixed top-0 w-full shadow-lg z-40 border-t border-orange-100 max-h-screen overflow-y-auto pb-20`}
      >
        <div className="px-2 pt-4 pb-6">
          {/* Поиск в мобильном меню */}
          <form onSubmit={handleSearch} className="mb-5 px-2">
            <div className="relative">
              <Input 
                type="text"
                placeholder="Поиск товаров..."
                className="pr-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
          
          {/* Профиль в мобильном меню */}
          {user ? (
            <div className="flex items-center justify-between mb-4 px-3 py-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <User className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/profile" className="p-2 rounded-full bg-gray-100 text-gray-700">
                  <Package className="h-4 w-4" />
                </Link>
                <button onClick={handleLogout} className="p-2 rounded-full bg-gray-100 text-gray-700">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 px-3">
              <Link href="/auth" className="flex items-center justify-center w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors">
                <LogIn className="h-4 w-4 mr-2" />
                Войти или зарегистрироваться
              </Link>
            </div>
          )}
          
          {/* Навигационные ссылки в мобильном меню */}
          <div className="space-y-0.5">
            <Link href="/" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors">
              Главная
            </Link>
            
            {/* Категории в мобильном меню */}
            <div className="px-3 py-2.5">
              <p className="text-base font-medium text-gray-700">Товары:</p>
              <div className="mt-1.5 pl-4 space-y-1.5">
                {categories.map((category) => (
                  <Link 
                    key={category.id} 
                    href={`/category/${category.slug}`}
                    className="block py-1.5 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
                <Link 
                  href="/products"
                  className="block py-1.5 text-gray-700 font-medium hover:text-orange-600 transition-colors"
                >
                  Все товары
                </Link>
              </div>
            </div>
            
            <Link href="/services" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              Услуги
            </Link>
            
            <Link href="/promotions" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              Акции
            </Link>
            
            <Link href="/publications" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              Публикации
            </Link>
            
            <Link href="/contacts" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              Контакты
            </Link>
            
            <Link href="/about" className="block px-3 py-2.5 text-base font-medium text-gray-700 hover:bg-red-50 hover:text-eps-red rounded-lg transition-colors">
              О компании
            </Link>
            
            {user?.role === 'admin' && (
              <Link href="/admin" className="block px-3 py-2.5 text-base font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                Админ-панель
              </Link>
            )}
          </div>
          
          {/* Контактная информация в мобильном меню */}
          <div className="mt-6 px-3 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2">Контактная информация:</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Телефон: 8 800 101 38 35</p>
              <p>Адрес: г. Волгоград, ул. им. Маршала Еременко 44</p>
              <p>Режим работы: пн. - пт.: 8:00 - 18:00</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Фиксированное мобильное меню внизу */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-30">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs mt-1">Главная</span>
          </Link>
          
          <Link href="/products" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">Товары</span>
          </Link>
          
          <Link href="/cart" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50 relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-eps-red text-white text-xs font-medium w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Корзина</span>
          </Link>
          
          {user ? (
            <Link href="/profile" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
              <div className="p-1.5 rounded-full bg-gray-50">
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1">Профиль</span>
            </Link>
          ) : (
            <Link href="/auth" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
              <div className="p-1.5 rounded-full bg-gray-50">
                <LogIn className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1">Войти</span>
            </Link>
          )}
          
          <Link href="/publications" className="flex flex-col items-center p-2 text-gray-600 hover:text-eps-red transition-colors">
            <div className="p-1.5 rounded-full bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <span className="text-xs mt-1">Статьи</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
