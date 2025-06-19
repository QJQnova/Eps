
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function makeAdmin() {
  console.log('Назначение прав администратора пользователю QQJFie...');

  try {
    // Находим пользователя QQJFie
    const [user] = await db.select().from(users).where(eq(users.username, 'QQJFie'));
    
    if (!user) {
      console.log('Пользователь QQJFie не найден');
      return;
    }

    console.log('Найден пользователь:', {
      id: user.id,
      username: user.username,
      email: user.email,
      currentRole: user.role
    });

    // Обновляем роль на admin
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.username, 'QQJFie'))
      .returning();

    console.log('Пользователь успешно обновлен:', {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      newRole: updatedUser.role
    });

    console.log('✅ QQJFie теперь администратор!');
    
  } catch (error) {
    console.error('Ошибка при назначении прав администратора:', error);
  }
  
  process.exit(0);
}

makeAdmin().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
