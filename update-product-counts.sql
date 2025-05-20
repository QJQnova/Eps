-- Обновление счетчиков товаров для всех категорий на основе фактического количества товаров
UPDATE categories 
SET product_count = (
    SELECT COUNT(*) 
    FROM products 
    WHERE products.category_id = categories.id AND products.is_active = true
);