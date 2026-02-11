# Инструкция по настройке Weight Tracker

## Шаг 1: Настройка Supabase

### 1.1 Создание таблиц

Зайди в свой проект Supabase, открой SQL Editor и выполни следующие запросы:

#### Таблица users (данные пользователей)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
  height DECIMAL(5,2) NOT NULL CHECK (height > 0),
  current_weight DECIMAL(5,2) NOT NULL CHECK (current_weight > 0),
  goal_weight DECIMAL(5,2) NOT NULL CHECK (goal_weight > 0),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'high', 'extreme')),
  pace TEXT NOT NULL CHECK (pace IN ('fast', 'optimal', 'slow')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политика: пользователь может видеть только свои данные
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Политика: пользователь может создавать свой профиль
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Политика: пользователь может обновлять свой профиль
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

#### Таблица entries (записи измерений)

```sql
CREATE TABLE entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  waist DECIMAL(5,2) CHECK (waist IS NULL OR waist > 0),
  hips DECIMAL(5,2) CHECK (hips IS NULL OR hips > 0),
  thigh DECIMAL(5,2) CHECK (thigh IS NULL OR thigh > 0),
  neck DECIMAL(5,2) CHECK (neck IS NULL OR neck > 0),
  active_calories DECIMAL(8,2) CHECK (active_calories IS NULL OR active_calories >= 0),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Создаем индекс для быстрого поиска по пользователю и дате
CREATE INDEX entries_user_date_idx ON entries(user_id, date DESC);

-- Включаем RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Политика: пользователь может видеть только свои записи
CREATE POLICY "Users can view own entries" ON entries
  FOR SELECT USING (auth.uid() = user_id);

-- Политика: пользователь может создавать свои записи
CREATE POLICY "Users can insert own entries" ON entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика: пользователь может обновлять свои записи
CREATE POLICY "Users can update own entries" ON entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Политика: пользователь может удалять свои записи
CREATE POLICY "Users can delete own entries" ON entries
  FOR DELETE USING (auth.uid() = user_id);
```

### 1.2 Настройка Anonymous Auth

1. Зайди в Authentication → Settings в панели Supabase
2. Включи "Enable Anonymous Sign-Ins"
3. Сохрани изменения

### 1.3 Получение учетных данных

1. Зайди в Settings → API
2. Скопируй:
   - Project URL (например: https://xxxxxxxxxxxxx.supabase.co)
   - anon public key (длинный ключ)

## Шаг 2: Настройка приложения

Открой файл `src/services/supabase.js` и замени:
- `YOUR_SUPABASE_URL` на свой Project URL
- `YOUR_SUPABASE_ANON_KEY` на свой anon public key

## Шаг 3: Запуск приложения

1. Установи Expo Go на свой iPhone из App Store
2. В терминале, в папке weight-tracker, выполни:
   ```bash
   npx expo start
   ```
3. Отсканируй QR-код с помощью камеры iPhone
4. Приложение откроется в Expo Go

## Готово!

Теперь ты можешь использовать приложение на своем iPhone!
