import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Определение схем для валидации форм
const requestResetSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email обязателен" })
    .email({ message: "Введите корректный email" }),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(6, { message: "Пароль должен содержать минимум 6 символов" }),
  confirmPassword: z
    .string()
    .min(6, { message: "Пароль должен содержать минимум 6 символов" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type RequestResetForm = z.infer<typeof requestResetSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// Компонент формы запроса сброса пароля
function RequestResetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const { toast } = useToast();

  const form = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: RequestResetForm) {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/password-reset/request", data);
      const result = await response.json();
      
      // В реальном приложении токен будет отправлен по email
      // Для тестирования сохраняем токен, полученный от API
      if (result.token) {
        setToken(result.token);
      }
      
      setSuccess(true);
      toast({
        title: "Запрос отправлен",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Произошла ошибка при запросе сброса пароля",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Восстановление пароля</CardTitle>
        <CardDescription>
          Введите ваш email для получения инструкций по сбросу пароля
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <p className="text-green-600">
              Инструкции по сбросу пароля отправлены на указанный email.
            </p>
            {token && (
              <div className="p-3 bg-gray-100 rounded">
                <p className="text-sm text-gray-600 mb-1">Для тестирования используйте этот токен:</p>
                <p className="text-xs break-all font-mono bg-white p-2 rounded border">{token}</p>
                <div className="mt-2">
                  <Link href={`/password-reset/reset?token=${token}`}>
                    <Button variant="link" className="p-0">Сбросить пароль с этим токеном</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Отправка...
                  </>
                ) : (
                  "Отправить инструкции"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/auth">
          <Button variant="link">Вернуться к авторизации</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Компонент формы установки нового пароля
function ResetPasswordForm({ token }: { token: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordForm) {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/password-reset/reset", {
        token: data.token,
        password: data.password,
      });
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        toast({
          title: "Успех!",
          description: "Ваш пароль был успешно обновлен",
        });
        
        // Перенаправление на страницу авторизации через 2 секунды
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } else {
        throw new Error(result.message || "Не удалось сбросить пароль");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Произошла ошибка при сбросе пароля",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyToken() {
    try {
      const response = await apiRequest("GET", `/api/password-reset/verify/${token}`);
      const result = await response.json();
      
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Недействительный токен",
          description: "Токен сброса пароля недействителен или истек",
        });
        navigate("/password-reset");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось проверить токен сброса пароля",
      });
      navigate("/password-reset");
    }
  }

  // Проверяем токен при монтировании компонента
  useState(() => {
    verifyToken();
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Установка нового пароля</CardTitle>
        <CardDescription>
          Введите новый пароль для вашего аккаунта
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center space-y-4">
            <p className="text-green-600">
              Ваш пароль был успешно обновлен!
            </p>
            <p>Сейчас вы будете перенаправлены на страницу авторизации.</p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Новый пароль</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтверждение пароля</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Сохранение...
                  </>
                ) : (
                  "Обновить пароль"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/password-reset">
          <Button variant="link">Вернуться к форме восстановления</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Главный компонент страницы
export default function PasswordResetPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const location = useLocation()[0];
  
  // Если пользователь уже авторизован, перенаправляем на главную
  if (user) {
    navigate("/");
    return null;
  }
  
  // Получаем токен из URL, если он есть
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const token = searchParams.get("token");
  
  // Разделяем логику на две части - запрос сброса и установка нового пароля
  const isReset = location.includes("/reset") && token;
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col justify-center">
          {isReset ? (
            <ResetPasswordForm token={token} />
          ) : (
            <RequestResetForm />
          )}
        </div>
        <div className="hidden md:block">
          <div className="p-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <h2 className="text-3xl font-bold mb-4">ЭПС</h2>
            <h3 className="text-xl font-semibold mb-4">Восстановление доступа</h3>
            <p className="mb-4">Забыли пароль? Не беспокойтесь! Мы поможем вам восстановить доступ к вашему аккаунту.</p>
            <p className="text-sm opacity-80">
              Для восстановления пароля вам потребуется указать email, который использовался при регистрации.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}