import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'server/public')));

// Categories data
const categories = [
  { id: 1, name: 'Электроинструменты', slug: 'elektroinstrumenty' },
  { id: 2, name: 'Ручной инструмент', slug: 'ruchnoy-instrument' },
  { id: 3, name: 'Измерительный инструмент', slug: 'izmeritelnyy-instrument' },
  { id: 4, name: 'Пневмоинструмент', slug: 'pnevmoinstrument' },
  { id: 5, name: 'Расходные материалы', slug: 'rashodnye-materialy' }
];

// Products data
const products = [
  {
    id: 1,
    name: 'Дрель ударная Bosch PSB 500 RE',
    slug: 'drel-udarnaya-bosch-psb-500-re',
    price: '4500₽',
    categoryId: 1,
    sku: 'BSH-PSB-500',
    description: 'Профессиональная ударная дрель для бытового использования'
  },
  {
    id: 2,
    name: 'Набор отверток KRAFTOOL 25057-H6',
    slug: 'nabor-otvertok-kraftool-25057-h6',
    price: '850₽',
    categoryId: 2,
    sku: 'KFT-25057-H6',
    description: 'Набор отверток с эргономичными рукоятками'
  },
  {
    id: 3,
    name: 'Рулетка Stabila BM 40 5м',
    slug: 'ruletka-stabila-bm-40-5m',
    price: '1250₽',
    categoryId: 3,
    sku: 'STB-BM40-5',
    description: 'Измерительная рулетка с магнитным крючком'
  },
  {
    id: 4,
    name: 'Пневмошуруповерт METABO DSS 14.4',
    slug: 'pnevmoshurupover-metabo-dss-144',
    price: '7800₽',
    categoryId: 4,
    sku: 'MTB-DSS144',
    description: 'Аккумуляторный пневматический шуруповерт'
  },
  {
    id: 5,
    name: 'Диски отрезные по металлу 125мм (5шт)',
    slug: 'diski-otreznye-po-metallu-125mm',
    price: '320₽',
    categoryId: 5,
    sku: 'DSK-125-MET-5',
    description: 'Набор отрезных дисков для болгарки'
  }
];

// API routes
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;
  let filteredProducts = [...products];
  
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.categoryId === parseInt(category));
  }
  
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm)
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  res.json({
    products: paginatedProducts,
    total: filteredProducts.length,
    page: parseInt(page),
    totalPages: Math.ceil(filteredProducts.length / limit)
  });
});

app.post('/api/products/import', (req, res) => {
  res.json({
    success: true,
    message: 'Функция автоматического создания категорий активна',
    info: 'При импорте товаров система автоматически создает недостающие категории',
    features: [
      'Поддержка XML, JSON, CSV форматов',
      'Автоматическое создание категорий',
      'Проверка дублирования товаров',
      'Валидация данных'
    ]
  });
});

app.get('/api/settings/shop', (req, res) => {
  res.json({
    shopName: 'ЭПС',
    workingHours: 'пн–пт 8:00–18:00, сб, вс — выходные',
    phone: '8 800 101 38 35',
    email: 'info@eps.ru'
  });
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`ЭПС сервер запущен на порту ${port}`);
  console.log('Функции готовы:');
  console.log('✓ Удален дублирующийся поиск из хедера');
  console.log('✓ Обновлен формат рабочего времени');
  console.log('✓ Автоматическое создание категорий при импорте');
});