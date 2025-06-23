import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, FileText, Database, CheckCircle, AlertCircle, Package } from "lucide-react";

interface ImportStats {
  totalProducts: number;
  totalCategories: number;
  lastImport: string | null;
}

interface ImportResult {
  success: boolean;
  message: string;
  categoriesCreated: number;
  productsImported: number;
  productsSkipped: number;
  errors: string[];
}

export default function AdminImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Get import statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ImportStats>({
    queryKey: ["/api/admin/import-stats"],
  });

  // CSV import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/import-csv', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Ошибка импорта');
      }

      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/import-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      
      toast({
        title: "Импорт завершен",
        description: result.message,
      });
      
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка импорта",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Неверный формат файла",
          description: "Поддерживаются только CSV файлы",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер файла: 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "Файл не выбран",
        description: "Выберите CSV файл для импорта",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(10);
    importMutation.mutate(selectedFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Импорт каталога</h1>
      </div>

      {/* Import Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Статистика каталога
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalProducts || 0}</div>
                <div className="text-sm text-gray-600">Товаров в каталоге</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.totalCategories || 0}</div>
                <div className="text-sm text-gray-600">Категорий</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm font-semibold text-purple-600">
                  {stats?.lastImport ? new Date(stats.lastImport).toLocaleDateString() : 'Не выполнялся'}
                </div>
                <div className="text-sm text-gray-600">Последний импорт</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Импорт CSV файла
          </CardTitle>
          <CardDescription>
            Загрузите CSV файл от поставщика pittools.ru для импорта товаров в каталог
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Поддерживаются CSV файлы с разделителем ";" в кодировке Windows-1251 или UTF-8.
              Ожидаемые колонки: Изображения, Название, Артикул, Цена, Валюта, Наличие, Категория.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">Выберите CSV файл</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={importMutation.isPending}
              />
            </div>

            {selectedFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-600">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={importMutation.isPending}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            )}

            {importMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Импорт в процессе...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="w-full"
            >
              {importMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Импорт...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Импортировать товары
                </>
              )}
            </Button>
          </div>

          {/* Import Results */}
          {importMutation.data && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Результаты импорта:</div>
                  <div>• Создано категорий: {importMutation.data.categoriesCreated}</div>
                  <div>• Импортировано товаров: {importMutation.data.productsImported}</div>
                  <div>• Пропущено товаров: {importMutation.data.productsSkipped}</div>
                  {importMutation.data.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-red-600">Ошибки:</div>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {importMutation.data.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {importMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Инструкции по импорту</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 space-y-2">
            <div>1. Подготовьте CSV файл с товарами от поставщика pittools.ru</div>
            <div>2. Убедитесь, что файл содержит колонки: Изображения, Название, Артикул, Цена, Валюта, Наличие, Категория</div>
            <div>3. Выберите файл и нажмите "Импортировать товары"</div>
            <div>4. Дождитесь завершения импорта и проверьте результаты</div>
            <div>5. Новые категории будут созданы автоматически</div>
            <div>6. Товары с существующими артикулами будут пропущены</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}