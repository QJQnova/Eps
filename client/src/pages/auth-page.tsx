import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Схема для входа
const loginSchema = z.object({
  username: z.string().min(3, "Имя пользователя должно содержать не менее 3 символов"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
});

// Схема для регистрации
const registerSchema = z.object({
  username: z.string().min(3, "Имя пользователя должно содержать не менее 3 символов"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  confirmPassword: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Если пользователь уже авторизован, перенаправляем на главную
  if (user) {
    return <Redirect to="/" />;
  }

  // Форма входа
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Форма регистрации
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Обработчик входа
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Обработчик регистрации
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex flex-col w-full lg:flex-row">
        {/* Форма авторизации */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Вход в аккаунт</CardTitle>
                    <CardDescription>
                      Войдите в свой аккаунт чтобы получить доступ к заказам и профилю
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                          {loginMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Вход...
                            </>
                          ) : (
                            "Войти"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Нет аккаунта?{" "}
                      <button
                        className="text-eps-orange hover:underline"
                        onClick={() => setActiveTab("register")}
                      >
                        Зарегистрируйтесь
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Регистрация</CardTitle>
                    <CardDescription>
                      Создайте аккаунт для заказа товаров и отслеживания статуса заказов
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя пользователя</FormLabel>
                              <FormControl>
                                <Input placeholder="Придумайте имя пользователя" {...field} />
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
                                <Input type="password" placeholder="Придумайте пароль" {...field} />
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
                                <Input type="password" placeholder="Повторите пароль" {...field} />
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
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Регистрация...
                            </>
                          ) : (
                            "Зарегистрироваться"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Уже есть аккаунт?{" "}
                      <button
                        className="text-eps-orange hover:underline"
                        onClick={() => setActiveTab("login")}
                      >
                        Войдите
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Hero секция */}
        <div className="w-full lg:w-1/2 bg-eps-gradient text-white p-12 hidden lg:flex lg:flex-col lg:justify-center">
          <div className="max-w-xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">ЭПС Инструменты</h1>
            <h2 className="text-2xl font-semibold mb-8">Профессиональные инструменты для любых задач</h2>
            <p className="text-lg mb-6">
              Войдите в свой аккаунт, чтобы получить доступ к более чем 1000 наименований профессиональных инструментов 
              высокого качества. Мы предлагаем лучшие цены и быструю доставку по всей России.
            </p>
            <ul className="space-y-4 my-8">
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white text-eps-orange flex items-center justify-center mr-4">✓</div>
                <span>Широкий выбор инструментов для любых задач</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white text-eps-orange flex items-center justify-center mr-4">✓</div>
                <span>Профессиональные консультации по подбору</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white text-eps-orange flex items-center justify-center mr-4">✓</div>
                <span>Быстрая доставка и гарантия на все товары</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}