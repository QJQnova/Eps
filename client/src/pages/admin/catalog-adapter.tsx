import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminSidebar from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Bot, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface AdaptedProduct {
  name: string;
  sku: string;
  price: string;
  category: string;
  description: string;
  imageUrl?: string;
}

interface AdapterResponse {
  success: boolean;
  message: string;
  products?: AdaptedProduct[];
  csvData?: string;
}

export default function CatalogAdapter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adaptedData, setAdaptedData] = useState<AdaptedProduct[]>([]);
  const [csvData, setCsvData] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Мутация для адаптации каталога через Claude
  const adaptCatalogMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/admin/adapt-catalog", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка адаптации");
      }
      
      return await response.json();
    },
    onSuccess: (data: AdapterResponse) => {
      if (data.success && data.products) {
        setAdaptedData(data.products);
        setCsvData(data.csvData || "");
        toast({
          title: "Каталог адаптирован",
          description: `Успешно обработано ${data.products.length} товаров`,
        });
      } else {
        toast({
          title: "Ошибка адаптации",
          description: data.message,
          variant: "destructive",
        });
      }
      setProgress(100);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось адаптировать каталог",
        variant: "destructive",
      });
      setProgress(0);
    },
  });

  // Мутация для импорта адаптированных данных
  const importAdaptedMutation = useMutation({
    mutationFn: async () => {
      const blob = new Blob([csvData], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", blob, "adapted-catalog.csv");
      
      const response = await apiRequest("POST", "/api/products/bulk-import", formData);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Импорт завершен",
        description: data.message,
      });
      setAdaptedData([]);
      setCsvData("");
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка импорта",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAdaptedData([]);
      setCsvData("");
      setProgress(0);
    }
  };

  const handleAdaptCatalog = () => {
    if (!selectedFile) {
      toast({
        title: "Выберите файл",
        description: "Пожалуйста, выберите файл каталога для адаптации",
        variant: "destructive",
      });
      return;
    }

    setProgress(0);
    adaptCatalogMutation.mutate(selectedFile);
  };

  const handleDownloadCsv = () => {
    if (!csvData) return;
    
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "adapted-catalog.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templateCsv = `name,sku,price,category,description,imageUrl
Дрель электрическая BOSCH GSB 550,GSB550RE,0,Электроинструмент,"Профессиональная дрель с ударной функцией, мощность 550Вт, патрон 13мм, регулировка оборотов",data:image/svg+xml;base64,...
Молоток слесарный STANLEY 500г,STHT0-51907,0,Ручной инструмент,"Молоток слесарный с фибергласовой ручкой, вес 500г, антивибрационная система",data:image/svg+xml;base64,...
Пила циркулярная MAKITA HS7611,HS7611K,0,Электроинструмент,"Циркулярная пила 1600Вт, диск 190мм, глубина пропила 68мм, лазерная направляющая",data:image/svg+xml;base64,...`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Адаптация каталогов</h1>
            <p className="text-gray-500">
              Используйте Claude AI для автоматической адаптации каталогов поставщиков в стандартный формат
            </p>
          </div>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Загрузка файла</TabsTrigger>
              <TabsTrigger value="preview">Предварительный просмотр</TabsTrigger>
              <TabsTrigger value="template">Шаблон</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Адаптация каталога с помощью Claude AI
                  </CardTitle>
                  <CardDescription>
                    Загрузите каталог поставщика в любом формате (XLSX, CSV, XML). 
                    ИИ извлечет 5 основных полей: названия товаров, артикулы, категории, описания и создаст изображения-заглушки.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="catalog-file">Выберите файл каталога</Label>
                    <div className="mt-2">
                      <input
                        id="catalog-file"
                        type="file"
                        accept=".xlsx,.xls,.csv,.xml"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Выбран файл: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  {adaptCatalogMutation.isPending && (
                    <div className="space-y-2">
                      <Label>Прогресс обработки</Label>
                      <Progress value={75} className="w-full" />
                      <p className="text-sm text-gray-600">
                        Claude AI анализирует структуру каталога...
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button 
                      onClick={handleAdaptCatalog}
                      disabled={!selectedFile || adaptCatalogMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Bot className="h-4 w-4" />
                      {adaptCatalogMutation.isPending ? "Обработка..." : "Адаптировать каталог"}
                    </Button>
                    
                    {adaptedData.length > 0 && (
                      <>
                        <Button 
                          variant="outline"
                          onClick={handleDownloadCsv}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Скачать CSV
                        </Button>
                        
                        <Button 
                          onClick={() => importAdaptedMutation.mutate()}
                          disabled={importAdaptedMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {importAdaptedMutation.isPending ? "Импорт..." : "Импортировать в каталог"}
                        </Button>
                      </>
                    )}
                  </div>

                  {adaptedData.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Каталог успешно адаптирован! Обработано {adaptedData.length} товаров.
                        Вы можете просмотреть результат на вкладке "Предварительный просмотр".
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Предварительный просмотр адаптированных данных</CardTitle>
                  <CardDescription>
                    Проверьте результат обработки перед импортом в каталог
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {adaptedData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Название
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Артикул
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Цена
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Категория
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Описание
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {adaptedData.slice(0, 10).map((product, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.sku}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.price} ₽
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.category}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {product.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {adaptedData.length > 10 && (
                        <p className="mt-4 text-sm text-gray-600">
                          Показано первые 10 из {adaptedData.length} товаров
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Загрузите и адаптируйте каталог на вкладке "Загрузка файла"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="template" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Шаблон CSV файла</CardTitle>
                  <CardDescription>
                    Пример структуры данных, в который Claude AI адаптирует любой каталог поставщика
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template">Структура CSV файла:</Label>
                    <Textarea
                      id="template"
                      value={templateCsv}
                      readOnly
                      className="mt-2 font-mono text-sm"
                      rows={6}
                    />
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Claude AI автоматически определит соответствие полей в вашем каталоге и адаптирует их к этой структуре.
                      Поддерживаются файлы XLSX, CSV, XML любой структуры.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Поля CSV файла:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><strong>name</strong> - Название товара (обязательное)</li>
                      <li><strong>sku</strong> - Артикул товара (обязательное)</li>
                      <li><strong>price</strong> - Цена товара в рублях (обязательное)</li>
                      <li><strong>category</strong> - Категория товара (обязательное)</li>
                      <li><strong>description</strong> - Описание товара</li>
                      <li><strong>imageUrl</strong> - Ссылка на изображение товара</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}