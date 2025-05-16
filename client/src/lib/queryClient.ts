import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Для случая 404 при удалении объектов - возвращаем сам ответ без ошибки
    if (res.status === 404) {
      return;
    }
    
    try {
      const data = await res.json();
      throw { status: res.status, message: data.message || res.statusText, data };
    } catch (e) {
      // Если не можем прочитать JSON
      const text = await res.text();
      throw { status: res.status, message: text || res.statusText };
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  console.log(`API Request: ${method} ${url}`, data);
  
  // Добавляем параметр для обхода кэша
  const noCacheUrl = url.includes('?') 
    ? `${url}&_nocache=${Date.now()}` 
    : `${url}?_nocache=${Date.now()}`;
  
  try {
    const res = await fetch(noCacheUrl, {
      method,
      headers: {
        ...data ? { "Content-Type": "application/json" } : {},
        // Добавляем заголовки против кэширования
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Отключаем кэширование в fetch
      cache: 'no-store'
    });

    // Специальная обработка для DELETE запросов
    if (method === 'DELETE') {
      // Для успешно удаленных ресурсов
      if (res.status === 204) {
        return { success: true };
      }
      // Для ресурсов, которые не найдены (уже удалены)
      if (res.status === 404) {
        return { success: true, alreadyDeleted: true };
      }
    }

    await throwIfResNotOk(res);
    
    // Для всех запросов автоматически преобразуем ответ в JSON, если есть Content-Type
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json();
    }
    
    // Для пустых ответов (204 No Content)
    if (res.status === 204) {
      return null;
    }
    
    // Для всех остальных случаев возвращаем текст ответа
    try {
      return await res.text();
    } catch (e) {
      return null;
    }
  } catch (error) {
    console.error(`API Request Error: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options?: {
  on401?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  (options) =>
  async ({ queryKey }) => {
    const unauthorizedBehavior = options?.on401 || "throw";
    
    // Добавляем время к запросу для обхода кэширования
    const url = queryKey[0] as string;
    const noCacheUrl = url.includes('?') 
      ? `${url}&_nocache=${Date.now()}` 
      : `${url}?_nocache=${Date.now()}`;
    
    const res = await fetch(noCacheUrl, {
      credentials: "include",
      headers: {
        // Добавляем заголовки против кэширования
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Отключаем кэширование fetch
      cache: 'no-store'
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      // Настройки кеширования с отключенным длительным кэшированием
      staleTime: 0, // Данные становятся устаревшими сразу после получения
      gcTime: 1000, // Кэш сохраняется только 1 секунду после исчезновения с экрана
      retry: 1, // Одна повторная попытка при ошибке
      refetchOnMount: "always", // Всегда запрашиваем свежие данные при монтировании компонента
    },
    mutations: {
      retry: false,
    },
  },
});
