import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, ShoppingCart, Menu, X } from "lucide-react";
import { Category } from "@shared/schema";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  
  const { itemCount } = useCart();
  
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
  
  return (
    <header className="bg-white shadow-sm">
      <div className="bg-eps-gradient h-2"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-extrabold text-eps-gradient">ЭПС</span>
              <span className="ml-2 text-sm text-gray-500">Инструменты</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <form className="hidden sm:flex items-center relative w-64" onSubmit={handleSearch}>
              <Input 
                type="text" 
                placeholder="Поиск инструментов..." 
                className="w-full py-2 px-4 pr-8 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 text-gray-500 hover:text-primary"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            {/* Account & Cart */}
            <div className="flex items-center space-x-4">
              <Link href="/account" className="text-gray-700 hover:text-eps-orange flex items-center">
                <User className="h-5 w-5" />
                <span className="hidden md:inline ml-1">Профиль</span>
              </Link>
              
              <Link href="/cart" className="text-gray-700 hover:text-eps-orange flex items-center relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden md:inline ml-1">Корзина</span>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-eps-red text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
            
            {/* Mobile Menu Toggle */}
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
        
        {/* Main Navigation */}
        <nav className="hidden sm:flex py-3">
          <ul className="flex space-x-8">
            {categories.map((category) => (
              <li key={category.id} className="group relative">
                <Link 
                  href={`/category/${category.slug}`} 
                  className="text-gray-700 hover:text-eps-orange font-medium"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li className="group relative">
              <Link 
                href="/products" 
                className="text-gray-700 hover:text-eps-orange font-medium"
              >
                Все товары
              </Link>
            </li>
            <li className="group relative">
              <Link 
                href="/admin" 
                className="text-gray-700 hover:text-eps-orange font-medium"
              >
                Администратор
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Mobile Navigation */}
        <nav className={`sm:hidden py-3 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          {/* Search Bar Mobile */}
          <form className="flex items-center relative mb-4" onSubmit={handleSearch}>
            <Input 
              type="text" 
              placeholder="Поиск инструментов..." 
              className="w-full py-2 px-4 pr-8 rounded-lg border border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 text-gray-500"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <ul className="space-y-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link 
                  href={`/category/${category.slug}`} 
                  className="text-gray-700 hover:text-eps-orange font-medium block py-1"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link 
                href="/products" 
                className="text-gray-700 hover:text-eps-orange font-medium block py-1"
              >
                Все товары
              </Link>
            </li>
            <li>
              <Link 
                href="/admin" 
                className="text-gray-700 hover:text-eps-orange font-medium block py-1"
              >
                Администратор
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
