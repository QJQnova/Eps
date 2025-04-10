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
    <header className="bg-white shadow-sm">
      <div className="bg-eps-gradient h-2"></div>
      
      {/* Верхняя часть шапки */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Логотип */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-extrabold text-eps-orange">ЭПС</span>
              <span className="ml-1 text-gray-800 font-medium">Инструменты</span>
            </Link>
            
            {/* Поисковая строка и кнопки действий */}
            <div className="flex items-center space-x-4">
              {/* Поисковая строка */}
              <form className="hidden sm:flex items-center relative" onSubmit={handleSearch}>
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Поиск инструментов..." 
                    className="w-64 py-2 px-4 pr-10 rounded-md bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-eps-orange focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-eps-orange"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
              
              {/* Кнопки авторизации, профиля и корзины */}
              <div className="flex items-center space-x-4">
                {user ? (
                  // Для авторизованных пользователей
                  <>
                    <Link href="/profile" className="flex items-center text-gray-800 hover:text-eps-orange">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <User className="h-5 w-5 mx-auto sm:mx-0" />
                        <span className="text-xs mt-1 sm:mt-0 sm:ml-1.5 sm:text-sm">Профиль</span>
                      </div>
                    </Link>
                    
                    <Link href="/cart" className="flex items-center text-gray-800 hover:text-eps-orange relative">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="relative mx-auto sm:mx-0">
                          <ShoppingCart className="h-5 w-5" />
                          {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-eps-red text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                              {itemCount}
                            </span>
                          )}
                        </div>
                        <span className="text-xs mt-1 sm:mt-0 sm:ml-1.5 sm:text-sm">Корзина</span>
                      </div>
                    </Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center text-gray-800 hover:text-eps-orange"
                      disabled={logoutMutation.isPending}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <LogOut className="h-5 w-5 mx-auto sm:mx-0" />
                        <span className="text-xs mt-1 sm:mt-0 sm:ml-1.5 sm:text-sm">
                          {logoutMutation.isPending ? "Выход..." : "Выйти"}
                        </span>
                      </div>
                    </button>
                  </>
                ) : (
                  // Для неавторизованных пользователей
                  <>
                    <Link href="/auth" className="flex items-center text-gray-800 hover:text-eps-orange">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <LogIn className="h-5 w-5 mx-auto sm:mx-0" />
                        <span className="text-xs mt-1 sm:mt-0 sm:ml-1.5 sm:text-sm">Войти</span>
                      </div>
                    </Link>
                    
                    <Link href="/auth?tab=register" className="flex items-center text-gray-800 hover:text-eps-orange">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <User className="h-5 w-5 mx-auto sm:mx-0" />
                        <span className="text-xs mt-1 sm:mt-0 sm:ml-1.5 sm:text-sm">Регистрация</span>
                      </div>
                    </Link>
                  </>
                )}
              </div>
              
              {/* Кнопка мобильного меню */}
              <Button
                variant="ghost" 
                size="icon"
                className="sm:hidden text-gray-700 hover:text-eps-orange"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Навигационное меню */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Главная навигация */}
          <nav className="hidden sm:block">
            <ul className="flex h-12 items-center space-x-8">
              <li className="group relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-1 text-gray-800 hover:text-eps-orange font-medium px-3 py-1.5 h-auto rounded-md"
                    >
                      <Package className="h-4 w-4" />
                      Товары
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 max-h-[70vh] overflow-y-auto">
                    {categories.map((category) => (
                      <DropdownMenuItem key={category.id} asChild>
                        <Link 
                          href={`/category/${category.slug}`} 
                          className="w-full cursor-pointer"
                        >
                          {category.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/products" 
                        className="w-full cursor-pointer font-medium"
                      >
                        Все товары
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li className="group relative">
                <Link 
                  href="/admin" 
                  className="flex items-center gap-1 text-gray-800 hover:text-eps-orange font-medium px-3 py-1.5"
                >
                  <User className="h-4 w-4" />
                  Администратор
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Мобильная навигация */}
          <nav className={`sm:hidden py-4 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
            {/* Мобильная поисковая строка */}
            <form className="flex items-center relative mb-4" onSubmit={handleSearch}>
              <Input 
                type="text" 
                placeholder="Поиск инструментов..." 
                className="w-full py-2 px-4 pr-10 rounded-md bg-gray-100 border border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <ul className="space-y-3">
              <li>
                <div className="text-gray-800 font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md">
                  <Package className="h-4 w-4 mr-2" />
                  Товары
                </div>
                <ul className="pl-4 mt-2 space-y-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link 
                        href={`/category/${category.slug}`} 
                        className="text-gray-700 hover:text-eps-orange block py-1 text-sm"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                  <li className="border-t border-gray-100 pt-2 mt-2">
                    <Link 
                      href="/products" 
                      className="text-gray-700 hover:text-eps-orange font-medium block py-1"
                    >
                      Все товары
                    </Link>
                  </li>
                </ul>
              </li>
              {user ? (
                // Для авторизованных пользователей (мобильное меню)
                <>
                  <li className="border-t border-gray-200 pt-2">
                    <Link 
                      href="/profile" 
                      className="text-gray-700 hover:text-eps-orange font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Профиль
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/cart" 
                      className="text-gray-700 hover:text-eps-orange font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <div className="relative">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {itemCount > 0 && (
                          <span className="absolute -top-2 -right-1 bg-eps-red text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                            {itemCount}
                          </span>
                        )}
                      </div>
                      Корзина
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left text-gray-700 hover:text-eps-orange font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md"
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {logoutMutation.isPending ? "Выход..." : "Выйти"}
                    </button>
                  </li>
                  <li>
                    <Link 
                      href="/admin" 
                      className="text-gray-700 hover:text-eps-orange font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Администратор
                    </Link>
                  </li>
                </>
              ) : (
                // Для неавторизованных пользователей (мобильное меню)
                <>
                  <li className="border-t border-gray-200 pt-2">
                    <Link 
                      href="/auth" 
                      className="text-gray-700 hover:text-eps-orange font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Войти
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/auth?tab=register" 
                      className="text-gray-700 hover:text-eps-orange font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Регистрация
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/admin" 
                      className="text-gray-700 hover:text-eps-orange font-medium flex items-center py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Администратор
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
