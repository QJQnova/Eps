import { createContext, ReactNode, useContext, useState } from "react";
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
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; }>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<SelectUser | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    data: initialUser,
    error: initialError,
    isLoading: initialLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Initialize user state from the query
  useState(() => {
    setUser(initialUser ?? null);
    setError(initialError ?? null);
    setLoading(initialLoading);
  }, [initialUser, initialError, initialLoading]);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);

      // Проверяем, что данные переданы
      if (!username || !password) {
        return { success: false, message: "Необходимо указать имя пользователя и пароль" };
      }

      console.log("Отправляем данные:", { username, password });

      const response = await fetch("/api/simple-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, message: result.message || "Ошибка входа" };
      }
    } catch (error: any) {
      console.error("Ошибка входа:", error);
      return { success: false, message: "Произошла ошибка при входе" };
    } finally {
      setLoading(false);
    }
  };

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
        login,
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