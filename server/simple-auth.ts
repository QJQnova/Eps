import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupSimpleAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'eps-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Register endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Все поля обязательны" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь уже существует" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email уже используется" });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Ошибка регистрации" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Введите логин и пароль" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Ошибка входа" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Успешный выход" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req: Request, res: Response) => {
    const user = (req.session as any)?.user;
    if (!user) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  });
}

// Middleware to check authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  (req as any).user = user;
  next();
}

// Middleware to check admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req.session as any)?.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: "Требуются права администратора" });
  }
  (req as any).user = user;
  next();
}