-- =====================================================
-- ROW LEVEL SECURITY (RLS) НАСТРОЙКА ДЛЯ WEIGHT TRACKER
-- =====================================================
-- КРИТИЧЕСКИ ВАЖНО! Без этого все пользователи видят данные друг друга!
--
-- Выполните эти команды в Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =====================================================

-- 1. ВКЛЮЧАЕМ RLS ДЛЯ ТАБЛИЦЫ USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. ПОЛИТИКИ ДЛЯ USERS
-- Пользователь может читать только свою запись
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Пользователь может создать только свою запись
CREATE POLICY "Users can insert own data"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Пользователь может обновлять только свою запись
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. ВКЛЮЧАЕМ RLS ДЛЯ ТАБЛИЦЫ ENTRIES
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- 4. ПОЛИТИКИ ДЛЯ ENTRIES
-- Пользователь может читать только свои записи
CREATE POLICY "Users can read own entries"
ON entries FOR SELECT
USING (auth.uid() = user_id);

-- Пользователь может создавать только свои записи
CREATE POLICY "Users can insert own entries"
ON entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять только свои записи
CREATE POLICY "Users can update own entries"
ON entries FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Пользователь может удалять только свои записи
CREATE POLICY "Users can delete own entries"
ON entries FOR DELETE
USING (auth.uid() = user_id);

-- 5. ДОБАВЛЯЕМ ОГРАНИЧЕНИЕ УНИКАЛЬНОСТИ (для обработки дубликатов по дате)
-- Один пользователь не может иметь две записи на одну дату
CREATE UNIQUE INDEX entries_user_date_unique 
ON entries (user_id, date);

-- =====================================================
-- ИМЯ ПОЛЬЗОВАТЕЛЯ (для отображения в профиле)
-- =====================================================
-- Выполните, если в таблице users ещё нет колонки name:
-- ALTER TABLE users ADD COLUMN name TEXT;

-- =====================================================
-- ПРОВЕРКА
-- =====================================================
-- После выполнения команд проверьте:
-- 1. В Supabase Dashboard -> Table Editor -> entries
--    Должно быть: RLS: Enabled
-- 2. Попробуйте добавить записи в приложении
-- 3. Проверьте, что другие пользователи не видят ваши данные
-- =====================================================
