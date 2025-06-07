const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('client'));

// In-memory user storage for testing
const users = [];

// Serve clean auth page
app.get('/auth-test', (req, res) => {
  const htmlPath = path.join(__dirname, 'client', 'clean.html');
  res.sendFile(htmlPath);
});

// Registration endpoint
app.post('/api/simple-register', (req, res) => {
  console.log('Registration attempt:', req.body);
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).send('Все поля обязательны для заполнения');
  }
  
  // Check if user exists
  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(400).send('Пользователь уже существует');
  }
  
  // Add user
  const user = { id: users.length + 1, username, email, password };
  users.push(user);
  
  console.log('User registered successfully:', { username, email });
  res.json({ 
    success: true, 
    message: 'Регистрация успешна',
    user: { id: user.id, username, email }
  });
});

// Login endpoint
app.post('/api/simple-login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).send('Укажите имя пользователя и пароль');
  }
  
  // Find user
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).send('Неверное имя пользователя или пароль');
  }
  
  console.log('User logged in successfully:', username);
  res.json({ 
    success: true, 
    message: 'Вход выполнен',
    user: { id: user.id, username: user.username, email: user.email }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Сервер работает!', 
    time: new Date().toISOString(),
    usersCount: users.length
  });
});

const port = 5002;
app.listen(port, '0.0.0.0', () => {
  console.log(`Standalone auth server running on port ${port}`);
  console.log(`Access auth form at: http://localhost:${port}/auth-test`);
});