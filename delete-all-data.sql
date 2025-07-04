
-- Скрипт для полного удаления всех товаров и категорий

-- Отключаем проверку ограничений внешних ключей
SET session_replication_role = 'replica';

-- Удаляем все элементы корзины
DELETE FROM cart_items;

-- Удаляем все товары
DELETE FROM products;

-- Удаляем все категории
DELETE FROM categories;

-- Сбрасываем последовательности ID
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE cart_items_id_seq RESTART WITH 1;

-- Восстанавливаем проверку ограничений внешних ключей
SET session_replication_role = 'origin';

-- Проверяем результат
SELECT 'Products count: ' || COUNT(*) FROM products;
SELECT 'Categories count: ' || COUNT(*) FROM categories;
SELECT 'Cart items count: ' || COUNT(*) FROM cart_items;
