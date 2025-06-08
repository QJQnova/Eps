import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, FileText, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { parseFile } from "@/lib/file-parser";

// Sample templates
const CSV_TEMPLATE = `sku,name,slug,description,shortDescription,price,originalPrice,stock,categoryId,isActive,isFeatured,tag,imageUrl
TP001,Professional Cordless Drill,professional-cordless-drill,"18V lithium-ion battery drill with 2-speed gearbox","18V drill with LED work light",129.99,159.99,43,1,true,true,Best Seller,https://images.unsplash.com/photo-1572981779307-38b8cabb2407
TP002,Digital Laser Measure,digital-laser-measure,"Accurate laser measuring up to 50m with area and volume calculations","Precision laser measure",79.99,89.99,21,3,true,false,,https://images.unsplash.com/photo-1586864387789-628af9feed72
TP003,Premium Safety Glasses,premium-safety-glasses,"Anti-fog scratch-resistant lenses with UV protection","Safety glasses with UV protection",24.99,34.99,76,4,true,false,New,https://images.unsplash.com/photo-1530124566582-a618bc2615dc`;

const JSON_TEMPLATE = `[
  {
    "sku": "TP001",
    "name": "Professional Cordless Drill",
    "slug": "professional-cordless-drill",
    "description": "18V lithium-ion battery drill with 2-speed gearbox",
    "shortDescription": "18V drill with LED work light",
    "price": 129.99,
    "originalPrice": 159.99,
    "stock": 43,
    "categoryId": 1,
    "isActive": true,
    "isFeatured": true,
    "tag": "Best Seller",
    "imageUrl": "https://images.unsplash.com/photo-1572981779307-38b8cabb2407"
  },
  {
    "sku": "TP002",
    "name": "Digital Laser Measure",
    "slug": "digital-laser-measure",
    "description": "Accurate laser measuring up to 50m with area and volume calculations",
    "shortDescription": "Precision laser measure",
    "price": 79.99,
    "originalPrice": 89.99,
    "stock": 21,
    "categoryId": 3,
    "isActive": true,
    "isFeatured": false,
    "imageUrl": "https://images.unsplash.com/photo-1586864387789-628af9feed72"
  }
]`;

const XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2025-05-05MSK16:29:50+03:00">
<shop>
  <name>ЭПС</name>
  <company>ООО "ЭПС"</company>
  <url>https://eps-tools.ru</url>
  <currencies>
    <currency id="RUR" rate="1"/>
  </currencies>
  <categories>
    <category id="1">Электроинструменты</category>
    <category id="2">Ручные инструменты</category>
    <category id="3">Измерительное оборудование</category>
    <category id="4">Безопасность и защита</category>
  </categories>
  <offers>
    <offer id="TP001" available="true">
      <name>Профессиональная Беспроводная Дрель</name>
      <url>https://eps-tools.ru/product/professional-cordless-drill</url>
      <price>12999</price>
      <oldprice>15999</oldprice>
      <currencyId>RUR</currencyId>
      <categoryId>1</categoryId>
      <picture>https://images.unsplash.com/photo-1572981779307-38b8cabb2407</picture>
      <description>Профессиональная дрель с литий-ионным аккумулятором 18В и двухскоростным редуктором</description>
      <param name="Бренд">ЭПС</param>
      <param name="Напряжение">18В</param>
      <param name="Тип аккумулятора">Li-Ion</param>
      <param name="Скорости">2</param>
    </offer>
    <offer id="TP002" available="true">
      <name>Цифровой Лазерный Дальномер</name>
      <url>https://eps-tools.ru/product/digital-laser-measure</url>
      <price>7999</price>
      <oldprice>8999</oldprice>
      <currencyId>RUR</currencyId>
      <categoryId>3</categoryId>
      <picture>https://images.unsplash.com/photo-1586864387789-628af9feed72</picture>
      <description>Точное лазерное измерение до 50м с расчетом площади и объема</description>
      <param name="Бренд">ЭПС</param>
      <param name="Дальность">50м</param>
      <param name="Точность">±1мм</param>
      <param name="Функции">Площадь, Объем</param>
    </offer>
  </offers>
</shop>
</yml_catalog>`;

export default function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [result, setResult] = useState<{ success: number, failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Проверка типа файла
    const fileType = selectedFile.type;
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    // Проверяем тип файла и расширение
    if (
      (fileType !== 'text/csv' && fileType !== 'application/json' && 
       fileType !== 'text/xml' && fileType !== 'application/xml') &&
      (fileExtension !== 'csv' && fileExtension !== 'json' && fileExtension !== 'xml')
    ) {
      setError("Пожалуйста, загрузите файл в формате CSV, JSON или XML");
      return;
    }
    
    setFile(selectedFile);
    
    try {
      // Анализ и предпросмотр содержимого файла
      const parsedData = await parseFile(selectedFile);
      setPreviewData(parsedData.slice(0, 3)); // Показать первые 3 элемента
    } catch (err: any) {
      setError(err.message || "Не удалось обработать файл");
      setFile(null);
    }
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    // Create form data
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Отправляем запрос
      const response = await fetch("/api/products/bulk-import", {
        method: "POST",
        body: formData,
        credentials: "include", // Включаем cookies для авторизации
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Не удалось импортировать товары");
      }
      
      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Импорт успешно завершен",
        description: `Успешно импортировано ${data.success} товаров. Не удалось: ${data.failed}.`,
      });
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при загрузке");
      toast({
        title: "Ошибка импорта",
        description: err.message || "Не удалось импортировать товары",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Сбрасываем поле выбора файла
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const downloadTemplate = (type: "csv" | "json" | "xml") => {
    let template, fileName, mimeType;
    
    if (type === "csv") {
      template = CSV_TEMPLATE;
      fileName = "product-template.csv";
      mimeType = "text/csv";
    } else if (type === "json") {
      template = JSON_TEMPLATE;
      fileName = "product-template.json";
      mimeType = "application/json";
    } else {
      template = XML_TEMPLATE;
      fileName = "product-template.xml";
      mimeType = "application/xml";
    }
    
    const blob = new Blob([template], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Массовый импорт товаров</CardTitle>
        <CardDescription>
          Загрузите файл CSV, JSON или XML для импорта нескольких товаров одновременно.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            file ? 'border-primary bg-primary/5' : 'border-gray-300'
          } transition-colors`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.json,.xml" 
            className="hidden" 
          />
          
          <div className="mb-4">
            {file ? (
              <FileText className="mx-auto h-12 w-12 text-primary" />
            ) : (
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {file ? file.name : "Загрузка товаров"}
          </h4>
          
          <p className="text-gray-500 mb-4">
            {file 
              ? `${(file.size / 1024).toFixed(2)} KB · ${file.type}`
              : "Перетащите файл CSV, JSON или XML сюда, или нажмите для выбора файла"}
          </p>
          
          {!file && (
            <Button type="button" variant="outline" className="mx-auto">
              Выбрать файл
            </Button>
          )}
        </div>
        
        {/* Templates */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Нужен шаблон? Скачайте наши примеры:
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => downloadTemplate("csv")}
            >
              Шаблон CSV
            </Button>
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => downloadTemplate("json")}
            >
              Шаблон JSON
            </Button>
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => downloadTemplate("xml")}
            >
              Шаблон XML
            </Button>
          </div>
        </div>
        
        {/* Data preview */}
        {previewData && previewData.length > 0 && (
          <div className="mt-6">
            <Label className="text-sm font-medium mb-2 block">Предпросмотр данных</Label>
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0]).slice(0, 5).map((header) => (
                      <th 
                        key={header}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">
                      ...
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((item, index) => (
                    <tr key={index}>
                      {Object.values(item).slice(0, 5).map((value, i) => (
                        <td key={i} className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">
                          {value?.toString() || "-"}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm text-gray-500">...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Показано {previewData.length} из {file?.name.includes('.csv') ? 'множества' : JSON.parse(JSON.stringify(previewData)).length} записей.
            </p>
          </div>
        )}
        
        {/* Upload progress */}
        {isUploading && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <Label>Загрузка...</Label>
              <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        {/* Results */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Импорт завершен</h4>
              <p className="text-green-700 text-sm">
                Успешно импортировано {result.success} товаров.
                {result.failed > 0 && ` Не удалось импортировать ${result.failed} товаров.`}
              </p>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Ошибка импорта</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setFile(null);
              setPreviewData(null);
              setResult(null);
              setError(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Сбросить
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              'Загрузить и импортировать'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
