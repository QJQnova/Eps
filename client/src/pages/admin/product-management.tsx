import AdminSidebar from "@/components/admin/sidebar";
import ProductTable from "@/components/admin/product-table";
import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductManagement() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const handleDeleteAllProducts = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      // Используем обычный fetch для DELETE запроса
      const response = await fetch("/api/admin/products/delete-all", {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Проверяем статус
      if (response.ok) {
        toast({
          title: "Все товары удалены",
          description: "Операция выполнена успешно"
        });
        
        // Полностью сбрасываем кеш и принудительно обновляем страницу для отображения актуальных данных
        queryClient.invalidateQueries();
        queryClient.resetQueries();
        
        // Добавляем небольшую задержку, чтобы запросы успели отработать
        setTimeout(() => {
          // Принудительно переходим на первую страницу для гарантированной перезагрузки данных
          window.location.href = '/admin/products';
        }, 1000);
      } else {
        throw new Error("Не удалось удалить все товары. Статус: " + response.status);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось удалить все товары",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление товарами</h1>
          <Button 
            variant="destructive" 
            className="flex items-center gap-2"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Удалить все товары
          </Button>
        </div>
        <ProductTable />
        
        {/* Диалог подтверждения удаления всех товаров */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить все товары</AlertDialogTitle>
              <AlertDialogDescription>
                Вы действительно хотите удалить ВСЕ товары? Это действие необратимо!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-500 hover:bg-red-600" 
                onClick={handleDeleteAllProducts}
                disabled={isDeleting}
              >
                {isDeleting ? "Удаление..." : "Удалить все"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
