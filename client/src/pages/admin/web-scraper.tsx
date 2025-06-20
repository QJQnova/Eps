import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";
import { 
  Globe, 
  PlayCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Calendar,
  Package,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Supplier {
  id: string;
  name: string;
  baseUrl: string;
  catalogUrls: string[];
  updateInterval: number;
  lastUpdate?: string;
  isActive: boolean;
}

interface ScrapeResult {
  success: boolean;
  scraped: number;
  imported: number;
  failed: number;
  products: any[];
  error?: string;
}

export default function WebScraper() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scrapingSupplier, setScrapingSupplier] = useState<string | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState<{ [key: string]: number }>({});

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const scrapeMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await apiRequest("POST", `/api/suppliers/${supplierId}/scrape`);
      return await response.json();
    },
    onMutate: (supplierId) => {
      setScrapingSupplier(supplierId);
      setScrapeProgress({ ...scrapeProgress, [supplierId]: 0 });
    },
    onSuccess: (result: ScrapeResult, supplierId) => {
      if (result.success) {
        toast({
          title: "Парсинг завершен",
          description: `Собрано ${result.scraped} товаров, импортировано ${result.imported}, ошибок ${result.failed}`,
        });
        setScrapeProgress({ ...scrapeProgress, [supplierId]: 100 });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      } else {
        toast({
          title: "Ошибка парсинга",
          description: result.error || "Неизвестная ошибка",
          variant: "destructive",
        });
      }
      setScrapingSupplier(null);
    },
    onError: (error: any, supplierId) => {
      toast({
        title: "Ошибка парсинга",
        description: error.message,
        variant: "destructive",
      });
      setScrapingSupplier(null);
      setScrapeProgress({ ...scrapeProgress, [supplierId]: 0 });
    },
  });

  const scheduleUpdatesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/suppliers/schedule-updates");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Планировщик запущен",
        description: "Автоматические обновления каталогов активированы",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка запуска планировщика",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getSupplierStatus = (supplier: Supplier) => {
    if (!supplier.isActive) return { status: "inactive", color: "destructive" };
    if (!supplier.lastUpdate) return { status: "never", color: "secondary" };
    
    const lastUpdate = new Date(supplier.lastUpdate);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate >= supplier.updateInterval) {
      return { status: "outdated", color: "destructive" };
    }
    
    return { status: "updated", color: "default" };
  };

  const formatLastUpdate = (lastUpdate?: string) => {
    if (!lastUpdate) return "Никогда";
    return new Date(lastUpdate).toLocaleString("ru-RU");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Автоматический парсинг каталогов</h1>
            <p className="text-gray-500">
              Настройка автоматического сбора товаров с сайтов поставщиков с помощью ИИ
            </p>
          </div>

          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Планировщик обновлений
                </CardTitle>
                <CardDescription>
                  Запустите автоматические обновления каталогов по расписанию
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => scheduleUpdatesMutation.mutate()}
                  disabled={scheduleUpdatesMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {scheduleUpdatesMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Запуск...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Запустить планировщик
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            {suppliers?.map((supplier) => {
              const { status, color } = getSupplierStatus(supplier);
              const isCurrentlyScraping = scrapingSupplier === supplier.id;
              const progress = scrapeProgress[supplier.id] || 0;

              return (
                <Card key={supplier.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          {supplier.name}
                        </CardTitle>
                        <CardDescription>{supplier.baseUrl}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={color as any}>
                          {status === "updated" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {status === "outdated" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {status === "inactive" && <Clock className="h-3 w-3 mr-1" />}
                          {status === "never" && <Clock className="h-3 w-3 mr-1" />}
                          {status === "updated" && "Обновлен"}
                          {status === "outdated" && "Устарел"}
                          {status === "inactive" && "Отключен"}
                          {status === "never" && "Не обновлялся"}
                        </Badge>
                        {supplier.isActive && (
                          <Button
                            size="sm"
                            onClick={() => scrapeMutation.mutate(supplier.id)}
                            disabled={isCurrentlyScraping || scrapeMutation.isPending}
                          >
                            {isCurrentlyScraping ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Парсинг...
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Запустить
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isCurrentlyScraping && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Прогресс парсинга</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Clock className="h-4 w-4" />
                          Последнее обновление
                        </div>
                        <div className="font-medium">{formatLastUpdate(supplier.lastUpdate)}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <RefreshCw className="h-4 w-4" />
                          Интервал обновления
                        </div>
                        <div className="font-medium">{supplier.updateInterval} часов</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <Package className="h-4 w-4" />
                          Страниц каталога
                        </div>
                        <div className="font-medium">{supplier.catalogUrls.length}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Каталоги для парсинга:</div>
                      <div className="space-y-1">
                        {supplier.catalogUrls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}