import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// In-memory storage for testing
let users = [];

// Authentication endpoints
app.post('/api/simple-register', (req, res) => {
  console.log('Registration request:', req.body);
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).send('Все поля обязательны для заполнения');
  }
  
  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(400).send('Пользователь уже существует');
  }
  
  const user = { id: users.length + 1, username, email, password };
  users.push(user);
  
  console.log('User registered:', { username, email });
  res.json({ success: true, message: 'Регистрация успешна', user: { username, email } });
});

app.post('/api/simple-login', (req, res) => {
  console.log('Login request:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).send('Укажите имя пользователя и пароль');
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).send('Неверное имя пользователя или пароль');
  }
  
  console.log('User logged in:', username);
  res.json({ success: true, message: 'Вход выполнен', user: { username: user.username } });
});

// Serve the clean auth page
app.get('/clean-auth', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/clean.html'));
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Сервер работает!', 
    time: new Date().toISOString(),
    users: users.length
  });
});

const port = 5003;
app.listen(port, '0.0.0.0', () => {
  console.log(`Express-only server running on port ${port}`);
  console.log(`Test auth at: http://localhost:${port}/clean-auth`);
});

export default app;