import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Middleware для парсинга JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Отладка для POST запросов (после парсинга)
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`POST запрос на ${req.path}`);
    console.log('Headers Content-Type:', req.headers['content-type']);
    console.log('Headers Content-Length:', req.headers['content-length']);
    console.log('Parsed body:', req.body);
  }
  next();
});

// АГРЕССИВНОЕ отключение кэширования для всех ответов
app.use((req, res, next) => {
  // Максимальный набор заголовков против кэширования
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, private');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Last-Modified', new Date(0).toUTCString());
  res.header('ETag', '');
  res.header('Surrogate-Control', 'no-store');
  res.header('Vary', '*');
  res.header('X-Accel-Expires', '0');
  res.header('X-Cache', 'MISS');
  res.header('X-No-Cache', Date.now().toString());
  res.header('X-Timestamp', new Date().toISOString());
  res.header('X-Random', Math.random().toString(36));
  
  // Дополнительные заголовки для API
  if (req.path.startsWith('/api/')) {
    res.header('X-API-Time', Date.now().toString());
    res.header('X-API-Version', 'no-cache-v2');
    res.header('X-Content-Type-Options', 'nosniff');
  }
  
  // Заголовки для статических файлов
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.header('X-Static-No-Cache', 'true');
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
