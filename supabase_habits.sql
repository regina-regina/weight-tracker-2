-- =====================================================
-- ТРЕКИНГ ПРИВЫЧЕК: ТАБЛИЦЫ И RLS
-- =====================================================
-- Выполните в Supabase SQL Editor.
-- =====================================================

-- 1. Таблица привычек (одна запись = одна привычка пользователя)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Таблица отметок (один день — одна отметка на привычку)
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

-- 3. Индексы для быстрых выборок
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS habit_logs_user_id_idx ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS habit_logs_log_date_idx ON habit_logs(log_date);

-- 4. RLS для habits
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own habits"
ON habits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
ON habits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
ON habits FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
ON habits FOR DELETE
USING (auth.uid() = user_id);

-- 5. RLS для habit_logs
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own habit_logs"
ON habit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit_logs"
ON habit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit_logs"
ON habit_logs FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- Проверка: Table Editor — habits, habit_logs, RLS: Enabled
-- =====================================================
