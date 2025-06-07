import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function SimpleAuthPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoading, setIsLoading] = useState(false);

  // Состояние для формы входа
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  // Состояние для формы регистрации
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Обработчик входа
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Отправляем данные входа:", loginData);

      if (!loginData.username || !loginData.password) {
        throw new Error("Заполните все поля");
      }

      const response = await fetch("/api/simple-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка входа");
      }

      const userData = await response.json();
      console.log("Успешный вход:", userData);

      toast({
        title: "Успешный вход",
        description: "Добро пожаловать!",
      });

      // Обновляем страницу для перезагрузки состояния пользователя
      window.location.href = "/";
    } catch (error: any) {
      console.error("Ошибка входа:", error);
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик регистрации
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Отправляем данные регистрации:", registerData);

      if (!registerData.username || !registerData.email || !registerData.password) {
        throw new Error("Заполните все поля");
      }

      if (registerData.password !== registerData.confirmPassword) {
        throw new Error("Пароли не совпадают");
      }

      if (registerData.password.length < 6) {
        throw new Error("Пароль должен содержать минимум 6 символов");
      }

      const response = await fetch("/api/simple-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка регистрации");
      }

      const userData = await response.json();
      console.log("Успешная регистрация:", userData);

      toast({
        title: "Успешная регистрация",
        description: "Аккаунт создан! Теперь можете войти.",
      });

      // Переключаемся на вкладку входа
      setActiveTab("login");
      setRegisterData({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error("Ошибка регистрации:", error);
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Имя пользователя</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Введите имя пользователя"
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Введите пароль"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Выполняется вход..." : "Войти"}
                  </Button>
                </form>
              </TabsContent>

              {/* Форма регистрации */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Имя пользователя</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Введите имя пользователя"
                      value={registerData.username}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Введите email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Введите пароль"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Подтвердите пароль</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="Подтвердите пароль"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Создаем аккаунт..." : "Зарегистрироваться"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Правая панель с информацией о компании */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 to-yellow-600 items-center justify-center p-8 text-white">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold mb-6">ЭПС</h2>
          <p className="text-xl mb-8">
            Профессиональные инструменты для ваших задач
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Широкий ассортимент инструментов</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Гарантия качества</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Быстрая доставка</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Профессиональная поддержка</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}