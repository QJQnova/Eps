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
async function hashPassword(password: string) {
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
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Неверное имя пользователя" });
        }
        
        // Для тестирования, пока у нас нет хеширования
        if (user.password === password) {
          return done(null, user);
        }
        
        // Раскомментируйте этот код после реализации хеширования паролей
        // if (await comparePasswords(password, user.password)) {
        //   return done(null, user);
        // }
        
        return done(null, false, { message: "Неверный пароль" });
      } catch (err) {
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
      
      // Для реального приложения раскомментируйте следующую строку:
      // const hashedPassword = await hashPassword(password);
      
      const user = await storage.createUser({
        username,
        email,
        password, // В реальном приложении: hashedPassword
        isAdmin: false
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
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Ошибка авторизации" });
      }
      
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        // Не возвращаем пароль в ответе
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
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