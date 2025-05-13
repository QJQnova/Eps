import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product, Category } from "@shared/schema";
import { Loader2, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function SqlDeletePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 20; // Увеличенный лимит для этой страницы
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append("query", searchTerm);
  if (categoryFilter) queryParams.append("categoryId", categoryFilter);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  
  // Fetch products
  const { data, isLoading, refetch } = useQuery<{
    products: Product[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }>({ 
    queryKey: [`/api/products?${queryParams.toString()}`],
  });
  
  // Fetch categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/categories"],
  });
  
  const categories = categoriesData?.categories || [];
  
  // SQL удаление товара напрямую
  const handleSqlDelete = async (id: number) => {
    if (!id || isDeleting) return;
    
    setIsDeleting(true);
    console.log(`Начало SQL-удаления товара ${id}...`);
    
    try {
      // Визуально удаляем товар из списка немедленно для лучшего UX
      if (data && data.products) {
        const updatedProducts = data.products.filter(product => product.id !== id);
        
        // Обновляем UI мгновенно через кэш запросов
        queryClient.setQueryData(
          [`/api/products?${queryParams.toString()}`], 
          {
            ...data,
            products: updatedProducts,
            pagination: {
              ...data.pagination,
              total: Math.max(0, data.pagination.total - 1)
            }
          }
        );
      }
      
      // Вызываем специальный SQL-маршрут удаления
      const response = await fetch(`/api/admin/hard-delete-product/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка при SQL-удалении товара");
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log("SQL-удаление успешно:", result);
        
        toast({
          title: "Товар удален",
          description: "Товар был успешно удален через прямой SQL-запрос.",
        });
        
        // Инвалидируем все запросы, связанные с товарами и категориями
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
          refetch(); // Принудительно обновляем текущую страницу
        }, 500);
      } else {
        throw new Error(result.message || "Неизвестная ошибка при удалении");
      }
    } catch (error) {
      console.error("Ошибка при SQL-удалении товара:", error);
      
      toast({
        title: "Ошибка при удалении",
        description: error instanceof Error ? error.message : "Не удалось удалить товар",
        variant: "destructive"
      });
      
      // В любом случае пытаемся обновить данные
      setTimeout(() => {
        refetch();
      }, 500);
    } finally {
      setIsDeleting(false);
      setDeletingProductId(null);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">SQL Удаление товаров</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <p className="text-gray-700 mb-4">
            Эта страница позволяет удалять товары напрямую из базы данных через SQL-запросы, минуя все проверки и ограничения.
            Используйте эту функцию только в крайнем случае, когда стандартное удаление не работает.
          </p>
          <p className="text-red-600 font-medium">
            Внимание! Удаление через SQL необратимо и не может быть отменено.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
          <form className="flex-1" onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Поиск товаров..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          
          <div className="w-full md:w-64">
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все категории</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Товар</TableHead>
                <TableHead className="hidden md:table-cell">Категория</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead className="hidden md:table-cell">Остаток</TableHead>
                <TableHead className="text-right">SQL Удаление</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <Skeleton className="h-6 w-40" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.products && data.products.length > 0 ? (
                data.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.imageUrl || "https://placehold.co/100x100?text=Нет+фото"} 
                          alt={product.name} 
                          className="h-10 w-10 object-cover rounded" 
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {categories.find(c => c.id === product.categoryId)?.name || "—"}
                    </TableCell>
                    <TableCell>{product.price?.toLocaleString('ru-RU')} ₽</TableCell>
                    <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setDeletingProductId(product.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        SQL-удаление
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <p className="text-gray-500">Товары не найдены</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-500">
              Показано {(page - 1) * limit + 1}-
              {Math.min(page * limit, data.pagination.total)} из {data.pagination.total} товаров
            </p>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              <Button 
                variant="outline"
                onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
        
        {/* Диалог подтверждения удаления */}
        <AlertDialog open={deletingProductId !== null} onOpenChange={(open) => !open && setDeletingProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>SQL-удаление товара</AlertDialogTitle>
              <AlertDialogDescription>
                Вы собираетесь удалить товар напрямую из базы данных через SQL-запрос.
                Это действие необратимо и не может быть отменено. Все данные товара будут полностью удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  if (deletingProductId !== null) {
                    handleSqlDelete(deletingProductId);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Удаление...
                  </>
                ) : "Подтвердить SQL-удаление"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}