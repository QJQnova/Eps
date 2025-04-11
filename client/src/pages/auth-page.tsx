import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";

// Схема для валидации данных формы логина
const loginSchema = z.object({
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  password: z.string().min(1, { message: "Пароль обязателен" }),
});

// Схема для валидации данных формы регистрации
const registerSchema = z.object({
  username: z.string().min(3, { message: "Имя пользователя должно содержать минимум 3 символа" }),
  email: z.string().email({ message: "Введите корректный email" }),
  password: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
  confirmPassword: z.string().min(1, { message: "Подтвердите пароль" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Проверяем URL-параметры для определения начальной вкладки
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    }
  }, []);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();

  // Редирект, если пользователь уже авторизован
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Форма для входа
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Форма для регистрации
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Обработчик отправки формы входа
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  // Обработчик отправки формы регистрации
  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Удаляем поле confirmPassword перед отправкой
    const { confirmPassword, ...registerData } = data;
    
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        toast({
          title: "Успешная регистрация",
          description: `Аккаунт ${registerData.username} успешно создан!`,
        });
        setLocation("/");
      },
      onError: (error) => {
        toast({
          title: "Ошибка регистрации",
          description: error.message || "Не удалось зарегистрировать пользователя",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Форма */}
      <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Авторизация</CardTitle>
            <CardDescription>
              Войдите в свой аккаунт или создайте новый
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              {/* Форма входа */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя пользователя</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите имя пользователя" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Введите пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Выполняется вход..." : "Войти"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Форма регистрации */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя пользователя</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите имя пользователя" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Введите email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Введите пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Подтверждение пароля</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Подтвердите пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Выполняется регистрация..." : "Зарегистрироваться"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Информация о компании */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-orange-500 to-red-600 p-12 text-white flex-col justify-center">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold mb-6">ЭПС - ваш надежный партнер в мире инструментов</h1>
          <p className="text-xl mb-8">
            Более 15 лет мы предоставляем качественные инструменты и оборудование для профессионалов и любителей.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Преимущества покупки у нас:</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Широкий ассортимент инструментов</li>
                <li>Гарантия качества на всю продукцию</li>
                <li>Профессиональные консультации</li>
                <li>Быстрая доставка по всей России</li>
                <li>Специальные предложения для постоянных клиентов</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold">Контактная информация:</h3>
              <p className="mt-2">
                Адрес: г. Волгоград, ул. им. Маршала Еременко 44<br />
                Телефон: +7 8442 50-58-57<br />
                Часы работы: пн. - пт.: 8:00 - 19:00, сб.: 9:00 - 15:00, вс: выходной
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}