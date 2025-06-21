import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, Globe, Package, AlertCircle, CheckCircle } from "lucide-react";

interface ImportResult {
  success: boolean;
  message: string;
  categoriesCreated: number;
  productsImported: number;
  failed: number;
  error?: string;
}

export default function SupplierImporter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [supplierUrl, setSupplierUrl] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [description, setDescription] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const importMutation = useMutation({
    mutationFn: async (data: { url: string; name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/suppliers/import-catalog", data);
      return await response.json() as ImportResult;
    },
    onMutate: () => {
      setIsImporting(true);
      setProgress(0);
      setCurrentStep("Начинаю анализ сайта поставщика...");
    },
    onSuccess: (result: ImportResult) => {
      if (result.success) {
        toast({
          title: "Импорт завершен успешно",
          description: `Создано категорий: ${result.categoriesCreated}, импортировано товаров: ${result.productsImported}`,
        });
        setProgress(100);
        setCurrentStep("Импорт завершен успешно!");
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        // Очищаем форму
        setSupplierUrl("");
        setSupplierName("");
        setDescription("");
      } else {
        toast({
          title: "Ошибка импорта",
          description: result.error || "Неизвестная ошибка",
          variant: "destructive",
        });
      }
      setIsImporting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка импорта",
        description: error.message,
        variant: "destructive",
      });
      setIsImporting(false);
      setProgress(0);
      setCurrentStep("");
    },
  });

  const handleImport = () => {
    if (!supplierUrl.trim() || !supplierName.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({
      url: supplierUrl.trim(),
      name: supplierName.trim(),
      description: description.trim() || undefined,
    });
  };

  // Симуляция прогресса для лучшего UX
  if (isImporting && progress < 90) {
    setTimeout(() => {
      setProgress(prev => Math.min(prev + 5, 90));
      if (progress < 30) {
        setCurrentStep("Анализирую структуру сайта...");
      } else if (progress < 60) {
        setCurrentStep("Извлекаю категории товаров...");
      } else if (progress < 90) {
        setCurrentStep("Загружаю товары и их характеристики...");
      }
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Импорт каталога поставщика</h1>
          <p className="text-gray-600">Полная загрузка товаров и категорий с сайта поставщика</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Форма импорта */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Данные поставщика
            </CardTitle>
            <CardDescription>
              Укажите URL сайта поставщика для полного импорта каталога
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierUrl">URL сайта поставщика *</Label>
              <Input
                id="supplierUrl"
                placeholder="https://example-supplier.ru"
                value={supplierUrl}
                onChange={(e) => setSupplierUrl(e.target.value)}
                disabled={isImporting}
              />
              <p className="text-sm text-gray-500">
                Укажите главную страницу или страницу каталога
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Название поставщика *</Label>
              <Input
                id="supplierName"
                placeholder="Название компании"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                disabled={isImporting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание (опционально)</Label>
              <Textarea
                id="description"
                placeholder="Краткое описание поставщика"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isImporting}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleImport} 
              disabled={isImporting || !supplierUrl.trim() || !supplierName.trim()}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-spin" />
                  Импортирую...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Начать импорт
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Информация и прогресс */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Как это работает
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <p className="font-medium">Анализ сайта</p>
                  <p className="text-sm text-gray-600">ИИ анализирует структуру сайта поставщика</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <p className="font-medium">Извлечение категорий</p>
                  <p className="text-sm text-gray-600">Автоматическое создание категорий товаров</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <p className="font-medium">Импорт товаров</p>
                  <p className="text-sm text-gray-600">Загрузка всех товаров с полными характеристиками</p>
                </div>
              </div>
            </div>

            {isImporting && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Прогресс импорта</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">{currentStep}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Результаты предыдущих импортов */}
      <Card>
        <CardHeader>
          <CardTitle>Важные примечания</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Поддерживаемые сайты:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Любые интернет-магазины</li>
                <li>• Каталоги производителей</li>
                <li>• B2B площадки</li>
                <li>• Корпоративные сайты</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Что извлекается:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Названия и описания товаров</li>
                <li>• Цены и артикулы</li>
                <li>• Изображения товаров</li>
                <li>• Технические характеристики</li>
                <li>• Категории и подкатегории</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}