import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Serve static files from server/public
app.use(express.static(path.join(__dirname, 'server/public')));

// Basic API endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'working', 
    features: [
      'Удален дублирующийся поиск из хедера',
      'Обновлен формат рабочего времени',
      'Добавлена функция автоматического создания категорий при импорте'
    ],
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/categories', (req, res) => {
  res.json([]);
});

const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log('Доступно по адресу: http://localhost:5000');
});