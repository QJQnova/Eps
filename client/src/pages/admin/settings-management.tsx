import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";

// UI компоненты
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";

// Схема формы для основных настроек магазина
const shopSettingsSchema = z.object({
  shopName: z.string().min(1, "Название магазина обязательно"),
  shopDescription: z.string().optional(),
  contactEmail: z.string().email("Введите корректный email").min(1, "Email обязателен"),
  contactPhone: z.string().min(1, "Телефон обязателен"),
  address: z.string().min(1, "Адрес обязателен"),
  workingHours: z.string().optional(),
  enableRegistration: z.boolean().default(true),
  enableCheckout: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
});

// Схема для настроек SEO
const seoSettingsSchema = z.object({
  siteTitle: z.string().min(1, "Title обязателен"),
  metaDescription: z.string().max(160, "Описание должно быть не более 160 символов").optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url("Укажите корректный URL").optional().or(z.literal("")),
  googleAnalyticsId: z.string().optional(),
  yandexMetrikaId: z.string().optional(),
});

type ShopSettingsFormValues = z.infer<typeof shopSettingsSchema>;
type SeoSettingsFormValues = z.infer<typeof seoSettingsSchema>;

export default function SettingsManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("shop");

  // Запрос настроек магазина
  const { 
    data: shopSettingsData, 
    isLoading: isLoadingShopSettings,
    error: shopSettingsError
  } = useQuery({
    queryKey: ["/api/admin/settings/shop"],
    queryFn: getQueryFn({ on401: "reject" })
  });

  // Запрос SEO настроек
  const { 
    data: seoSettingsData, 
    isLoading: isLoadingSeoSettings,
    error: seoSettingsError
  } = useQuery({
    queryKey: ["/api/admin/settings/seo"],
    queryFn: getQueryFn({ on401: "reject" })
  });
  
  // Обработка ошибок загрузки настроек магазина
  React.useEffect(() => {
    if (shopSettingsError) {
      toast({
        title: "Ошибка загрузки",
        description: `Не удалось загрузить настройки магазина: ${shopSettingsError.message}`,
        variant: "destructive",
      });
    }
  }, [shopSettingsError, toast]);
  
  // Обработка ошибок загрузки SEO настроек
  React.useEffect(() => {
    if (seoSettingsError) {
      toast({
        title: "Ошибка загрузки",
        description: `Не удалось загрузить SEO настройки: ${seoSettingsError.message}`,
        variant: "destructive",
      });
    }
  }, [seoSettingsError, toast]);

  // Форма для основных настроек
  const shopSettingsForm = useForm<ShopSettingsFormValues>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      shopName: "ЭПС",
      shopDescription: "Коллекция профессиональных инструментов",
      contactEmail: "info@example.com",
      contactPhone: "+7 8442 50-58-57",
      address: "г. Волгоград, ул. им. Маршала Еременко 44",
      workingHours: "пн. - пт.: 8:00 - 19:00, сб.: 9:00 - 15:00, вс: выходной",
      enableRegistration: true,
      enableCheckout: true,
      maintenanceMode: false,
    },
  });

  // Форма для настроек SEO
  const seoSettingsForm = useForm<SeoSettingsFormValues>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      siteTitle: "ЭПС - Коллекция профессиональных инструментов",
      metaDescription: "ЭПС - магазин профессиональных инструментов в Волгограде. Большой выбор, доступные цены.",
      metaKeywords: "инструменты, электроинструменты, ручные инструменты, Волгоград",
      ogImage: "",
      googleAnalyticsId: "",
      yandexMetrikaId: "",
    },
  });

  // Обновление форм после получения данных
  React.useEffect(() => {
    if (shopSettingsData) {
      shopSettingsForm.reset(shopSettingsData);
    }
  }, [shopSettingsData, shopSettingsForm]);

  React.useEffect(() => {
    if (seoSettingsData) {
      seoSettingsForm.reset(seoSettingsData);
    }
  }, [seoSettingsData, seoSettingsForm]);

  // Мутация для сохранения основных настроек
  const saveShopSettingsMutation = useMutation({
    mutationFn: async (data: ShopSettingsFormValues) => {
      return await apiRequest("PUT", "/api/admin/settings/shop", data);
    },
    onSuccess: () => {
      toast({
        title: "Настройки сохранены",
        description: "Основные настройки магазина успешно обновлены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка сохранения",
        description: `Не удалось сохранить настройки: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Мутация для сохранения настроек SEO
  const saveSeoSettingsMutation = useMutation({
    mutationFn: async (data: SeoSettingsFormValues) => {
      return await apiRequest("PUT", "/api/admin/settings/seo", data);
    },
    onSuccess: () => {
      toast({
        title: "Настройки сохранены",
        description: "SEO настройки магазина успешно обновлены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка сохранения",
        description: `Не удалось сохранить настройки: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Обработчик отправки формы основных настроек
  const onSubmitShopSettings = (data: ShopSettingsFormValues) => {
    saveShopSettingsMutation.mutate(data);
  };

  // Обработчик отправки формы SEO настроек
  const onSubmitSeoSettings = (data: SeoSettingsFormValues) => {
    saveSeoSettingsMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Настройки магазина</h1>
          <p className="text-gray-500">Управление основными настройками и параметрами магазина</p>
        </div>

        <Tabs defaultValue="shop" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="shop">Основные настройки</TabsTrigger>
            <TabsTrigger value="seo">SEO и метаданные</TabsTrigger>
            <TabsTrigger value="backup">Резервное копирование</TabsTrigger>
          </TabsList>

          {/* Вкладка основных настроек */}
          <TabsContent value="shop">
            <Card>
              <CardHeader>
                <CardTitle>Основные настройки магазина</CardTitle>
                <CardDescription>
                  Настройка основной информации о магазине и контактных данных
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...shopSettingsForm}>
                  <form onSubmit={shopSettingsForm.handleSubmit(onSubmitShopSettings)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={shopSettingsForm.control}
                        name="shopName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название магазина</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shopSettingsForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email для связи</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shopSettingsForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон для связи</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shopSettingsForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Адрес</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shopSettingsForm.control}
                        name="workingHours"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Часы работы</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shopSettingsForm.control}
                        name="shopDescription"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Описание магазина</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                value={field.value || ""} 
                                className="min-h-[120px]" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />
                    <h3 className="text-lg font-medium mb-4">Параметры работы магазина</h3>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={shopSettingsForm.control}
                        name="enableRegistration"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Регистрация пользователей</FormLabel>
                              <FormDescription>
                                Разрешить пользователям регистрироваться на сайте
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shopSettingsForm.control}
                        name="enableCheckout"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Оформление заказов</FormLabel>
                              <FormDescription>
                                Разрешить пользователям оформлять заказы
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={shopSettingsForm.control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Режим обслуживания</FormLabel>
                              <FormDescription>
                                Включить режим обслуживания (сайт будет доступен только администраторам)
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={saveShopSettingsMutation.isPending || !shopSettingsForm.formState.isDirty}
                      >
                        {saveShopSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saveShopSettingsMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка SEO настроек */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO и метаданные</CardTitle>
                <CardDescription>
                  Настройка SEO-параметров, метатегов и счетчиков аналитики
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...seoSettingsForm}>
                  <form onSubmit={seoSettingsForm.handleSubmit(onSubmitSeoSettings)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={seoSettingsForm.control}
                        name="siteTitle"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Заголовок сайта (Title)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Основной заголовок для главной страницы сайта
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={seoSettingsForm.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Meta описание</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                value={field.value || ""}
                                className="min-h-[80px]" 
                              />
                            </FormControl>
                            <FormDescription>
                              Краткое описание сайта для поисковых систем (не более 160 символов)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={seoSettingsForm.control}
                        name="metaKeywords"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Meta ключевые слова</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              Ключевые слова, разделенные запятыми
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={seoSettingsForm.control}
                        name="ogImage"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Изображение для соцсетей (Open Graph)</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} type="url" />
                            </FormControl>
                            <FormDescription>
                              URL изображения, которое будет отображаться при публикации ссылок в соцсетях
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="col-span-2 my-4" />
                      <h3 className="col-span-2 text-lg font-medium mb-2">Счетчики и аналитика</h3>

                      <FormField
                        control={seoSettingsForm.control}
                        name="googleAnalyticsId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Google Analytics</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="G-XXXXXXXXXX" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={seoSettingsForm.control}
                        name="yandexMetrikaId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Яндекс.Метрики</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} placeholder="XXXXXXXX" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={saveSeoSettingsMutation.isPending || !seoSettingsForm.formState.isDirty}
                      >
                        {saveSeoSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {saveSeoSettingsMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка резервного копирования */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Резервное копирование</CardTitle>
                <CardDescription>
                  Управление резервными копиями базы данных и файлов магазина
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-3">Резервное копирование базы данных</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Создайте резервную копию базы данных с каталогом товаров, заказами и пользователями
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-sm font-medium">Последняя резервная копия:</p>
                        <p className="text-sm text-gray-500">Не создавалась</p>
                      </div>
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Создать резервную копию
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-3">Настройки резервного копирования</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Switch id="auto-backup" />
                        <div>
                          <Label htmlFor="auto-backup" className="font-medium">Автоматическое резервное копирование</Label>
                          <p className="text-sm text-gray-500">
                            Автоматически создавать резервные копии базы данных по расписанию
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                        <div>
                          <Label htmlFor="backup-frequency">Частота копирования</Label>
                          <select 
                            id="backup-frequency" 
                            className="w-full mt-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                            disabled
                          >
                            <option>Ежедневно</option>
                            <option>Еженедельно</option>
                            <option>Ежемесячно</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor="backup-time">Время</Label>
                          <Input id="backup-time" type="time" value="03:00" disabled />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="backup-retention">Срок хранения резервных копий</Label>
                          <select 
                            id="backup-retention" 
                            className="w-full mt-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                            disabled
                          >
                            <option>7 дней</option>
                            <option>14 дней</option>
                            <option>30 дней</option>
                            <option>90 дней</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2">Отмена</Button>
                    <Button disabled>Сохранить настройки</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}