import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import AdminSidebar from "@/components/admin/sidebar";

export default function SqlDeletePage() {
  const [productId, setProductId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const { toast } = useToast();

  // Загрузить список товаров
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products-raw-list");
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Ошибка при загрузке товаров:", error);
    }
  };

  // Удаление товара через прямой SQL запрос
  const handleDeleteProduct = async (id: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/hard-delete-product/${id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Успех!",
          description: data.message,
        });
        
        // Обновить список товаров
        setProducts(products.filter(p => p.id !== parseInt(id)));
        setProductId("");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Ошибка при удалении:", error);
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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">SQL Удаление товаров</h1>
        
        <div className="bg-red-50 border border-red-300 rounded p-4 mb-6">
          <p className="text-red-700 font-medium">
            <strong>Внимание!</strong> Эта страница использует прямые SQL-запросы для удаления товаров.
            Удаление происходит немедленно и не может быть отменено.
          </p>
        </div>
        
        <div className="flex gap-4 mb-8">
          <Input
            type="text"
            placeholder="ID товара"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="max-w-xs"
          />
          <Button 
            variant="destructive"
            onClick={() => handleDeleteProduct(productId)}
            disabled={!productId || loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Удалить
          </Button>
        </div>
        
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Артикул</th>
                  <th className="p-3 text-left">Название</th>
                  <th className="p-3 text-right">Цена</th>
                  <th className="p-3 text-center">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{product.id}</td>
                      <td className="p-3">{product.sku}</td>
                      <td className="p-3">{product.name}</td>
                      <td className="p-3 text-right">{parseFloat(product.price).toLocaleString('ru-RU')} ₽</td>
                      <td className="p-3 text-center">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id.toString())}
                          disabled={loading}
                          className="inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Удалить
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Товары не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-6">
          <Button onClick={fetchProducts} variant="outline">
            Обновить список
          </Button>
        </div>
      </div>
    </div>
  );
}