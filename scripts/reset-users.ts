
import { db } from '../server/db';
import { users } from '../shared/schema';
import bcrypt from 'bcrypt';

async function resetUsers() {
  console.log('Начинаем сброс пользователей...');

  try {
    // Удаляем всех пользователей
    console.log('Удаление всех пользователей...');
    await db.delete(users);
    console.log('Все пользователи удалены');

    // Создаем нового пользователя
    console.log('Создание нового пользователя...');
    const hashedPassword = await bcrypt.hash('100202z', 10);
    
    const [newUser] = await db.insert(users).values({
      username: 'QJFie',
      email: 'qjfie@example.com',
      password: hashedPassword,
      role: 'admin'
    }).returning();

    console.log('Пользователь создан:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });

    console.log('Сброс пользователей завершен!');
    console.log('Данные для входа:');
    console.log('Логин: QJFie');
    console.log('Пароль: 100202z');
    
  } catch (error) {
    console.error('Ошибка при сбросе пользователей:', error);
  }
  
  process.exit(0);
}

resetUsers().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
