import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Функция для хеширования пароля
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Функция для сравнения паролей
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "ЭПС-secret-key", // В реальном приложении должно быть в переменных окружения
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Установите true в production с HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 неделя
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    }, async (username, password, done) => {
      try {
        console.log("LocalStrategy: Попытка входа пользователя:", username);
        
        if (!username || !password) {
          console.log("LocalStrategy: Отсутствуют учетные данные");
          return done(null, false, { message: "Необходимо указать имя пользователя и пароль" });
        }
        
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log("LocalStrategy: Пользователь не найден");
          return done(null, false, { message: "Неверное имя пользователя" });
        }
        
        // Проверяем сначала обычное сравнение для тестовых аккаунтов
        if (user.password === password) {
          console.log("LocalStrategy: Успешный вход с простым паролем");
          return done(null, user);
        }
        
        // Проверяем хешированный пароль
        try {
          if (await comparePasswords(password, user.password)) {
            console.log("LocalStrategy: Успешный вход с хешированным паролем");
            return done(null, user);
          }
        } catch (error) {
          // Если произошла ошибка при сравнении хеша, продолжаем
          console.log("Ошибка сравнения паролей:", error);
        }
        
        console.log("LocalStrategy: Неверный пароль");
        return done(null, false, { message: "Неверный пароль" });
      } catch (err) {
        console.error("LocalStrategy: Ошибка:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user: Express.User, done: (err: Error | null, id: number) => void) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done: (err: Error | null, user?: Express.User) => void) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err: any) {
      done(err);
    }
  });

  // Маршруты аутентификации
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Все поля обязательны для заполнения" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
      }
      
      // Хешируем пароль
      const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: "user",
        isActive: true
      });
      
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        // Не возвращаем пароль в ответе
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Попытка входа, содержимое запроса:", req.body);
    console.log("Заголовки запроса:", req.headers);
    
    // Создаем ручную обработку логина без использования passport.authenticate
    (async () => {
      try {
        // Проверяем наличие имени пользователя и пароля
        const { username, password } = req.body;
        
        if (!username || !password) {
          console.log("Отсутствуют учетные данные в запросе");
          return res.status(400).json({ message: "Необходимо указать имя пользователя и пароль" });
        }
        
        // Ищем пользователя в базе
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log("Пользователь не найден:", username);
          return res.status(401).json({ message: "Неверное имя пользователя или пароль" });
        }
        
        // Проверяем пароль (сначала простой, затем хешированный)
        let passwordValid = false;
        
        if (user.password === password) {
          console.log("Успешная аутентификация с простым паролем");
          passwordValid = true;
        } else {
          try {
            passwordValid = await comparePasswords(password, user.password);
            if (passwordValid) {
              console.log("Успешная аутентификация с хешированным паролем");
            }
          } catch (error) {
            console.error("Ошибка при проверке пароля:", error);
          }
        }
        
        if (!passwordValid) {
          console.log("Неверный пароль для пользователя:", username);
          return res.status(401).json({ message: "Неверное имя пользователя или пароль" });
        }
        
        // Если пароль верный, входим в систему
        req.login(user, (err) => {
          if (err) {
            console.error("Ошибка при создании сессии:", err);
            return next(err);
          }
          
          console.log("Успешный вход пользователя:", username);
          
          // Не возвращаем пароль в ответе
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      } catch (error) {
        console.error("Ошибка при обработке входа:", error);
        return next(error);
      }
    })();
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка при выходе из системы" });
      }
      res.status(200).json({ message: "Выход выполнен успешно" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Не авторизован" });
    }
    
    // Не возвращаем пароль в ответе
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}