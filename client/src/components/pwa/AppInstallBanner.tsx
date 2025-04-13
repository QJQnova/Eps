import { useState, useEffect } from 'react';
import { Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

// Интервал между показами баннера (3 дня)
const BANNER_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000;

export default function AppInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Проверка, нужно ли показывать баннер
    const shouldShowBanner = () => {
      // Если приложение уже запущено в режиме standalone, баннер не нужен
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return false;
      }
      
      // Проверяем, поддерживается ли PWA установка
      const isPWASupported = 
        'serviceWorker' in navigator && 
        (navigator.userAgent.includes('Chrome') || 
         navigator.userAgent.includes('Firefox') || 
         /iPad|iPhone|iPod/.test(navigator.userAgent));
      
      if (!isPWASupported) return false;
      
      // Проверяем, когда последний раз показывали баннер
      const lastShown = localStorage.getItem('appInstallBannerLastShown');
      if (!lastShown) return true;
      
      return Date.now() - parseInt(lastShown, 10) > BANNER_INTERVAL_MS;
    };
    
    // Показываем баннер с задержкой после загрузки страницы
    const timer = setTimeout(() => {
      if (isMobile && shouldShowBanner()) {
        setShowBanner(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isMobile]);
  
  // Закрытие баннера и сохранение времени
  const closeBanner = () => {
    setShowBanner(false);
    localStorage.setItem('appInstallBannerLastShown', Date.now().toString());
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="relative rounded-lg bg-gradient-to-r from-eps-red to-red-800 mb-6 overflow-hidden">
      <div className="absolute top-3 right-3">
        <button 
          onClick={closeBanner}
          className="text-white/70 hover:text-white"
          aria-label="Закрыть баннер"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center px-5 py-4">
        <div className="md:mr-8 mb-4 md:mb-0">
          <h3 className="text-lg font-semibold text-white">Установите мобильное приложение ЭПС</h3>
          <p className="text-white/80 text-sm mt-1">
            Получите быстрый доступ к каталогу инструментов даже в оффлайн-режиме!
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-2 md:mt-0 md:ml-auto">
          <Button
            onClick={() => {
              alert('Чтобы установить приложение: \n1. В Chrome: нажмите кнопку меню (три точки) и выберите "Установить приложение" \n2. В Safari: нажмите кнопку "Поделиться" и выберите "На экран Домой"');
              closeBanner();
            }}
            className="bg-white hover:bg-gray-100 text-eps-red font-medium"
            size="sm"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Установить сейчас
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={closeBanner}
          >
            Позже
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Декоративные элементы */}
      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10"></div>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3"></div>
    </div>
  );
}