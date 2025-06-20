import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin/sidebar";
import { CheckCircle, XCircle, Loader2, Download, Database } from "lucide-react";

interface SupplierResult {
  supplier: string;
  scraped: number;
  imported: number;
  failed: number;
  error?: string;
}

interface MassImportResult {
  message: string;
  totalImported: number;
  totalFailed: number;
  suppliersProcessed: number;
  results: SupplierResult[];
}

const SUPPLIERS = [
  { id: 'tss', name: 'TSS', status: 'Готов' },
  { id: 'sturm', name: 'STURM TOOLS', status: 'Готов' },
  { id: 'dck', name: 'DCK', status: 'Готов' },
  { id: 'zubr', name: 'ZUBR', status: 'Готов' },
  { id: 'instrument', name: 'INSTRUMENT.RU', status: 'Готов' },
  { id: 'senix', name: 'SENIX', status: 'Готов' },
  { id: 'altec', name: 'ALTEC', status: 'Готов' },
  { id: 'oli', name: 'OLI RUSSIA', status: 'Готов' },
  { id: 'rusgeocom', name: 'RUSGEOCOM', status: 'Готов' },
  { id: 'kornor', name: 'KORNOR', status: 'Готов' },
  { id: 'abrasives', name: 'ABRASIVES.RU', status: 'Готов' },
  { id: 'rusklimat', name: 'РУСКЛИМАТ', status: 'Готов' },
  { id: 'champion', name: 'CHAMPION TOOL', status: 'Готов' },
  { id: 'pittools', name: 'PIT TOOLS', status: 'Готов' },
  { id: 'interskol', name: 'ИНТЕРСКОЛ', status: 'Готов' }
];

export default function MassScraper() {
  const [results, setResults] = useState<SupplierResult[]>([]);
  const [currentSupplier, setCurrentSupplier] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const massImportMutation = useMutation({
    mutationFn: async (): Promise<MassImportResult> => {
      const response = await apiRequest("POST", "/api/admin/mass-scrape-import", {});
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      setProgress(100);
      setCurrentSupplier("");
      toast({
        title: "Массовый импорт завершен",
        description: `Импортировано: ${data.totalImported} товаров от ${data.suppliersProcessed} поставщиков`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка массового импорта",
        description: error.message,
        variant: "destructive",
      });
      setProgress(0);
      setCurrentSupplier("");
    },
  });

  const singleSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await apiRequest("POST", "/api/admin/scrape-supplier", { supplierId });
      return response.json();
    },
    onSuccess: (data, supplierId) => {
      toast({
        title: "Парсинг завершен",
        description: `${supplierId.toUpperCase()}: импортировано ${data.imported} товаров`,
      });
    },
    onError: (error: Error, supplierId) => {
      toast({
        title: "Ошибка парсинга",
        description: `${supplierId.toUpperCase()}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleMassImport = () => {
    setResults([]);
    setProgress(0);
    setCurrentSupplier("Запуск массового парсинга...");
    massImportMutation.mutate();
  };

  const handleSingleSupplier = (supplierId: string) => {
    singleSupplierMutation.mutate(supplierId);
  };

  const getTotalImported = () => results.reduce((sum, r) => sum + r.imported, 0);
  const getSuccessfulSuppliers = () => results.filter(r => r.imported > 0).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Массовый парсинг поставщиков
            </h1>
            <p className="text-gray-600">
              Агрессивное извлечение продуктов из каталогов российских поставщиков инструментов
            </p>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего поставщиков</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{SUPPLIERS.length}</div>
                <p className="text-xs text-muted-foreground">активных каталогов</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Успешных</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{getSuccessfulSuppliers()}</div>
                <p className="text-xs text-muted-foreground">парсинг выполнен</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Импортировано</CardTitle>
                <Download className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{getTotalImported()}</div>
                <p className="text-xs text-muted-foreground">товаров добавлено</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Прогресс</CardTitle>
                <Loader2 className={`h-4 w-4 ${massImportMutation.isPending ? 'animate-spin' : ''}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(progress)}%</div>
                <Progress value={progress} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Управление */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Управление парсингом</CardTitle>
              <CardDescription>
                Запустите массовый парсинг для извлечения продуктов из всех поставщиков
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleMassImport}
                  disabled={massImportMutation.isPending}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {massImportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Выполняется парсинг...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Запустить массовый парсинг
                    </>
                  )}
                </Button>
              </div>

              {massImportMutation.isPending && currentSupplier && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    {currentSupplier}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Список поставщиков */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Поставщики инструментов</CardTitle>
              <CardDescription>
                {SUPPLIERS.length} российских поставщиков готовы к парсингу
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUPPLIERS.map((supplier) => {
                  const result = results.find(r => r.supplier === supplier.name);
                  const isProcessing = singleSupplierMutation.isPending;
                  
                  return (
                    <div
                      key={supplier.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{supplier.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {supplier.status}
                        </Badge>
                      </div>
                      
                      {result && (
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs">
                            <span>Извлечено:</span>
                            <span className="font-medium">{result.scraped}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Импортировано:</span>
                            <span className="font-medium text-green-600">{result.imported}</span>
                          </div>
                          {result.failed > 0 && (
                            <div className="flex justify-between text-xs">
                              <span>Ошибок:</span>
                              <span className="font-medium text-red-600">{result.failed}</span>
                            </div>
                          )}
                          {result.error && (
                            <p className="text-xs text-red-600 mt-1">{result.error}</p>
                          )}
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSingleSupplier(supplier.id)}
                        disabled={isProcessing || massImportMutation.isPending}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : result?.imported > 0 ? (
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                        ) : (
                          <Download className="h-3 w-3 mr-1" />
                        )}
                        {result?.imported > 0 ? 'Обновить' : 'Парсить'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Результаты массового импорта */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Результаты парсинга</CardTitle>
                <CardDescription>
                  Детальные результаты по каждому поставщику
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.imported > 0
                          ? 'bg-green-50 border-green-200'
                          : result.error
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.imported > 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : result.error ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300" />
                          )}
                          <h3 className="font-semibold">{result.supplier}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Импортировано: {result.imported}
                          </p>
                          {result.scraped > 0 && (
                            <p className="text-xs text-gray-600">
                              Извлечено: {result.scraped}
                            </p>
                          )}
                        </div>
                      </div>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-2">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}