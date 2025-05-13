import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export default function EmergencyDeletePage() {
  const [productId, setProductId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [counter, setCounter] = useState(0);
  const { toast } = useToast();

  // Загрузить список продуктов при открытии страницы
  useEffect(() => {
    fetchProducts();
  }, [counter]);

  // Простая функция загрузки продуктов
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?page=1&limit=10");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Ошибка при загрузке продуктов:", error);
    }
  };

  // Функция экстренного удаления товара
  const handleDelete = async () => {
    if (!productId) return;
    
    setLoading(true);
    
    try {
      // Используем экстренный маршрут для удаления
      const response = await fetch(`/api/emergency-delete-product/${productId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast({
          title: "Товар удален!",
          description: `Товар с ID ${productId} был успешно удален.`,
        });
        
        // Сбросить поле ввода и обновить список
        setProductId("");
        setCounter(prev => prev + 1);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при удалении товара");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      toast({
        title: "Ошибка!",
        description: error instanceof Error ? error.message : "Не удалось удалить товар",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Экстренное удаление товаров</h1>
      
      <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
        <h2 className="text-red-800 font-semibold mb-2">Внимание!</h2>
        <p className="text-red-700">
          Этот инструмент позволяет принудительно удалить товар из базы данных напрямую.
          Используйте его только в крайнем случае, когда стандартное удаление не работает.
        </p>
      </div>
      
      <div className="grid gap-4 mb-8">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Введите ID товара для удаления"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
          <Button 
            className="bg-red-600 hover:bg-red-700 flex gap-2 items-center"
            onClick={handleDelete}
            disabled={!productId || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Удалить
          </Button>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Список товаров</h2>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Название</th>
              <th className="p-3 text-left">Артикул</th>
              <th className="p-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-3">{product.id}</td>
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">{product.sku}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => {
                        setProductId(product.id.toString());
                        handleDelete();
                      }}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  Товары не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button 
          variant="outline"
          onClick={() => setCounter(prev => prev + 1)}
        >
          Обновить список
        </Button>
      </div>
    </div>
  );
}