const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('client/dist'));

// Simple auth endpoints without complex dependencies
app.post('/api/auth/register', (req, res) => {
  console.log('Registration attempt:', req.body);
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }
  
  // Simple success response
  res.json({ 
    success: true, 
    message: 'Регистрация успешна',
    user: { username, email }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Укажите имя пользователя и пароль' });
  }
  
  // Simple success response
  res.json({ 
    success: true, 
    message: 'Вход выполнен',
    user: { username }
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Сервер работает!', time: new Date().toISOString() });
});

const port = 5001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple auth server running on port ${port}`);
});