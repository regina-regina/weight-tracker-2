-- Добавить необязательную колонку active_calories в entries (калории сверх базового обмена).
-- Выполнить в Supabase SQL Editor, если таблица уже создана без этой колонки.

ALTER TABLE entries
ADD COLUMN IF NOT EXISTS active_calories DECIMAL(8,2) CHECK (active_calories IS NULL OR active_calories >= 0);
