import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileImage, CheckCircle, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";

interface UploadResult {
  fileName: string;
  sku: string;
  success: boolean;
  message: string;
  productName?: string;
}

export default function ImageUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем список всех товаров для сопоставления
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && file.name.toLowerCase().endsWith('.png')
    );
    
    setSelectedFiles(imageFiles);
    setUploadResults([]);
  };

  const extractSkuFromFilename = (filename: string): string => {
    // Удаляем расширение и временные метки
    let sku = filename.replace(/\.png$/i, '').replace(/_\d+$/, '');
    
    // Удаляем TYPE и другие суффиксы
    sku = sku.replace(/\(TYPE\s+[A-Z]+\)/i, '');
    
    return sku.trim();
  };

  const findProductBySku = (sku: string): Product | undefined => {
    if (!products) return undefined;
    
    return products.find(product => 
      product.sku.toLowerCase() === sku.toLowerCase()
    );
  };

  const uploadSingleImage = async (file: File): Promise<UploadResult> => {
    const sku = extractSkuFromFilename(file.name);
    const product = findProductBySku(sku);
    
    if (!product) {
      return {
        fileName: file.name,
        sku,
        success: false,
        message: 'Товар с таким артикулом не найден'
      };
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productId', product.id.toString());
      formData.append('sku', sku);

      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        return {
          fileName: file.name,
          sku,
          success: true,
          message: 'Изображение успешно загружено',
          productName: product.name
        };
      } else {
        return {
          fileName: file.name,
          sku,
          success: false,
          message: result.message || 'Ошибка загрузки'
        };
      }
    } catch (error) {
      return {
        fileName: file.name,
        sku,
        success: false,
        message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      };
    }
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите файлы для загрузки",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const results: UploadResult[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const result = await uploadSingleImage(file);
      results.push(result);
      
      setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      setUploadResults([...results]);

      // Небольшая задержка между загрузками
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsUploading(false);
    
    // Обновляем кеш товаров
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    
    const successCount = results.filter(r => r.success).length;
    toast({
      title: "Загрузка завершена",
      description: `Успешно загружено: ${successCount} из ${results.length}`,
      variant: successCount > 0 ? "default" : "destructive"
    });
  };

  const getPreviewResults = () => {
    return selectedFiles.map(file => {
      const sku = extractSkuFromFilename(file.name);
      const product = findProductBySku(sku);
      
      return {
        fileName: file.name,
        sku,
        product,
        hasMatch: !!product
      };
    });
  };

  const previewResults = getPreviewResults();
  const matchedCount = previewResults.filter(r => r.hasMatch).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Массовая загрузка изображений товаров
        </h1>
        <p className="text-gray-600">
          Загрузите изображения товаров DCK. Система автоматически сопоставит их с товарами по артикулам.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Загрузка изображений</TabsTrigger>
          <TabsTrigger value="results">Результаты загрузки</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Выбор файлов
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image-files">Выберите PNG изображения</Label>
                <Input
                  id="image-files"
                  type="file"
                  multiple
                  accept=".png,image/png"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="mt-1"
                />
              </div>

              {selectedFiles.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Выбрано файлов: {selectedFiles.length} | 
                    Найдено соответствий: {matchedCount} | 
                    Без соответствий: {selectedFiles.length - matchedCount}
                  </AlertDescription>
                </Alert>
              )}

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Предварительный просмотр сопоставлений:</h3>
                  <div className="max-h-64 overflow-y-auto border rounded p-3 bg-gray-50">
                    {previewResults.slice(0, 10).map((item, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-2 rounded ${
                          item.hasMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        } mb-1 border`}
                      >
                        <div className="flex items-center gap-2">
                          {item.hasMatch ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-mono">{item.sku}</span>
                        </div>
                        <div className="text-sm text-gray-600 truncate max-w-md">
                          {item.hasMatch ? item.product?.name : 'Товар не найден'}
                        </div>
                      </div>
                    ))}
                    {previewResults.length > 10 && (
                      <div className="text-sm text-gray-500 mt-2">
                        ... и еще {previewResults.length - 10} файлов
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleBulkUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="flex items-center gap-2"
                >
                  <FileImage className="h-4 w-4" />
                  {isUploading ? 'Загрузка...' : `Загрузить ${selectedFiles.length} файлов`}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setUploadResults([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploading}
                >
                  Очистить
                </Button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">
                    Загрузка: {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Результаты загрузки</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Загрузок еще не было
                </p>
              ) : (
                <div className="space-y-2">
                  {uploadResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 rounded border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-mono text-sm">{result.sku}</div>
                          <div className="text-xs text-gray-500">{result.fileName}</div>
                        </div>
                      </div>
                      <div className="text-right max-w-md">
                        <div className="text-sm font-medium">
                          {result.success ? result.productName : result.message}
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.success ? result.message : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}