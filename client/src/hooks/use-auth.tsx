import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        console.log("Отправка данных входа:", credentials);

        // Убедимся, что все обязательные поля присутствуют
        if (!credentials.username || !credentials.password) {
          throw new Error("Необходимо указать имя пользователя и пароль");
        }

        const requestBody = {
          username: credentials.username.trim(),
          password: credentials.password,
        };

        console.log("Тело запроса для входа:", requestBody);

        // Сначала пробуем основной маршрут входа
        let response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          credentials: "include",
        });

        // Если основной маршрут не работает, пробуем альтернативный
        if (!response.ok) {
          console.log("Основной маршрут не сработал, пробуем альтернативный");
          response = await fetch("/api/simple-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            credentials: "include",
          });
        }

        console.log("Ответ сервера на login:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Ошибка входа:", errorData);
          throw new Error(errorData.message || "Неверное имя пользователя или пароль");
        }

        const userData = await response.json();
        console.log("Успешный вход:", userData);
        return userData;
      } catch (error: any) {
        console.error("Ошибка при входе:", error);
        throw new Error(error.message || "Произошла ошибка при входе");
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Успешный вход",
        description: `Добро пожаловать, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка входа",
        description: error.message || "Неверное имя пользователя или пароль",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        console.log("Отправка данных регистрации:", credentials);

        // Убедимся, что все обязательные поля присутствуют
        if (!credentials.username || !credentials.password || !credentials.email) {
          throw new Error("Все поля обязательны для заполнения");
        }

        const requestBody = {
          username: credentials.username.trim(),
          password: credentials.password,
          email: credentials.email.trim(),
        };

        console.log("Тело запроса для регистрации:", requestBody);

        // Сначала пробуем основной маршрут регистрации
        let response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          credentials: "include",
        });

        // Если основной маршрут не работает, пробуем альтернативный
        if (!response.ok) {
          console.log("Основной маршрут регистрации не сработал, пробуем альтернативный");
          response = await fetch("/api/simple-register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            credentials: "include",
          });
        }

        console.log("Ответ сервера на register:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Ошибка регистрации:", errorData);
          throw new Error(errorData.message || "Ошибка при регистрации пользователя");
        }

        const userData = await response.json();
        console.log("Успешная регистрация:", userData);
        return userData;
      } catch (error: any) {
        console.error("Ошибка при регистрации:", error);
        throw new Error(error.message || "Произошла ошибка при регистрации");
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Успешная регистрация",
        description: `Аккаунт ${user.username} успешно создан!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Не удалось зарегистрировать пользователя",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Ошибка при выходе из системы");
        }

        return true;
      } catch (error: any) {
        throw new Error(error.message || "Произошла ошибка при выходе из системы");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из аккаунта",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка выхода",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}