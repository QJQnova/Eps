import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append("query", searchTerm);
  if (categoryFilter) queryParams.append("categoryId", categoryFilter);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  
  // Fetch products
  const { data, isLoading } = useQuery<{
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
  
  // Fetch categories for filter
  const { data: categories = [] } = useQuery({ 
    queryKey: ["/api/categories"],
  });
  
  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Toggle product status (active/inactive)
  const toggleProductStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/products/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Status updated",
        description: "The product status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product status: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };
  
  const handleCategoryChange = (value: string) => {
    // Если выбрано "all", очищаем фильтр
    setCategoryFilter(value === "all" ? "" : value);
    setPage(1); // Reset to first page on category change
  };
  
  const getStatusBadgeClass = (product: Product) => {
    if (!product.isActive) return "bg-gray-200 text-gray-800";
    if (product.stock === 0) return "bg-red-100 text-red-800";
    if (product.stock < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };
  
  const getStatusText = (product: Product) => {
    if (!product.isActive) return "Inactive";
    if (product.stock === 0) return "Out of Stock";
    if (product.stock < 10) return "Low Stock";
    return "Active";
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Управление товарами</h2>
        
        <Link href="/admin/import">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Импорт товаров
          </Button>
        </Link>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="w-full sm:w-1/2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Button type="submit" className="sr-only">Search</Button>
          </div>
        </form>
        
        <div className="w-full sm:w-1/4">
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Link href="/admin/products/create" className="w-full sm:w-auto flex-shrink-0">
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Добавить товар
          </Button>
        </Link>
      </div>
      
      {/* Products Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead className="hidden md:table-cell">Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead className="hidden md:table-cell">Остаток</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
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
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.products && data.products.length > 0 ? (
              data.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img 
                        src={product.imageUrl || "https://placehold.co/100x100?text=No+Image"} 
                        alt={product.name} 
                        className="w-10 h-10 rounded object-cover bg-gray-100" 
                      />
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {categories.find(c => c.id === product.categoryId)?.name || "Unknown"}
                  </TableCell>
                  <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(product)}`}>
                      {getStatusText(product)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end items-center gap-2">
                      <Select 
                        defaultValue={product.isActive ? "active" : "inactive"}
                        onValueChange={(value) => {
                          toggleProductStatus.mutate({ 
                            id: product.id, 
                            isActive: value === "active" 
                          });
                        }}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Link href={`/admin/products/edit/${product.id}`}>
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => deleteProduct.mutate(product.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <p className="text-gray-500">No products found</p>
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
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} products
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline"
              onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
              disabled={page === data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
