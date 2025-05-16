-- Скрипт для полного удаления товаров и очистки связанных таблиц

-- Отключаем проверку ограничений внешних ключей
SET session_replication_role = 'replica';

-- Удаляем все товары из корзины
DELETE FROM cart_items;

-- Удаляем все товары из таблицы
DELETE FROM products;

-- Сбрасываем последовательность ID для таблицы товаров
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Восстанавливаем проверку ограничений внешних ключей
SET session_replication_role = 'origin';