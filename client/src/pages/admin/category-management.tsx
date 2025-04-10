import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Category } from "@shared/schema";

// Схема формы категории
const categoryFormSchema = z.object({
  name: z.string().min(1, "Название категории обязательно"),
  slug: z.string().min(1, "Slug обязателен").regex(/^[a-z0-9-]+$/, "Только строчные буквы, цифры и дефисы"),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CategoryManagement() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Получение списка категорий
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    select: (data) => data as Category[],
  });

  // Форма для создания/редактирования категории
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
    },
  });
  
  // Преобразование null в пустую строку для полей формы
  const handleNullableField = (value: string | null | undefined): string => {
    return value === null || value === undefined ? "" : value;
  };

  // Открытие диалога для создания новой категории
  const handleAddCategory = () => {
    form.reset({
      name: "",
      slug: "",
      description: "",
      icon: "",
    });
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  // Открытие диалога для редактирования категории
  const handleEditCategory = (category: Category) => {
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
    });
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  // Открытие диалога для удаления категории
  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Мутация для создания категории
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormValues) => 
      apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Категория успешно создана",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать категорию",
        variant: "destructive",
      });
    },
  });

  // Мутация для обновления категории
  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormValues & { id: number }) => 
      apiRequest("PATCH", `/api/categories/${data.id}`, {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
      }),
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Категория успешно обновлена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить категорию",
        variant: "destructive",
      });
    },
  });

  // Мутация для удаления категории
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      toast({
        title: "Успех",
        description: "Категория успешно удалена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить категорию. Возможно, в ней есть товары.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  // Обработка отправки формы
  const onSubmit = (data: CategoryFormValues) => {
    if (selectedCategory) {
      updateMutation.mutate({ ...data, id: selectedCategory.id });
    } else {
      createMutation.mutate(data);
    }
  };

  // Автоматическое создание slug из названия
  const generateSlug = () => {
    const name = form.getValues("name");
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      form.setValue("slug", slug);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Управление категориями</h1>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить категорию
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Категории товаров</CardTitle>
            <CardDescription>
              Всего категорий: {categories.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">Загрузка...</div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Tag className="mb-2 h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium">Нет категорий</h3>
                <p className="text-sm text-gray-500">
                  Добавьте первую категорию, чтобы начать наполнять каталог товаров
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Товаров</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.id}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell>{category.productCount || 0}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                              disabled={category.productCount ? category.productCount > 0 : false}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Диалог создания/редактирования категории */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? "Редактирование категории" : "Добавление категории"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Название категории"
                          onBlur={() => {
                            if (!selectedCategory && !form.getValues("slug")) {
                              generateSlug();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (URL)</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input {...field} placeholder="category-slug" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateSlug}
                        >
                          Сгенерировать
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={handleNullableField(field.value)}
                          placeholder="Описание категории" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Иконка (Lucide)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={handleNullableField(field.value)}
                          placeholder="Название иконки Lucide (например: tag, smartphone, tool)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Сохранение..."
                      : "Сохранить"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Подтверждение удаления</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                Вы уверены, что хотите удалить категорию{" "}
                <strong>{selectedCategory?.name}</strong>?
              </p>
              {selectedCategory?.productCount && selectedCategory.productCount > 0 && (
                <p className="mt-2 text-sm text-red-500">
                  Эта категория содержит товары. Удалите или переместите товары перед удалением категории.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedCategory && deleteMutation.mutate(selectedCategory.id)}
                disabled={
                  deleteMutation.isPending ||
                  (selectedCategory?.productCount ? selectedCategory.productCount > 0 : false)
                }
              >
                {deleteMutation.isPending ? "Удаление..." : "Удалить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}