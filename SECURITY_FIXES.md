# 🔒 Исправление уязвимостей безопасности и багов

## КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ (немедленно!)

### 1. Переместить API ключи в переменные окружения

**Файл**: `src/services/supabase.js`

Создайте файл `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xmurmwhvfvuytwtubwrk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Добавьте в `.gitignore`:
```
.env
.env.local
```

Обновите `src/services/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase credentials are missing');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 2. Настроить Row Level Security (RLS) в Supabase

Выполните в SQL Editor Supabase:

```sql
-- Включаем RLS для таблицы users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "Users can view own data" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Включаем RLS для таблицы entries
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Политики для entries
CREATE POLICY "Users can view own entries" 
ON entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" 
ON entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" 
ON entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" 
ON entries FOR DELETE 
USING (auth.uid() = user_id);
```

### 3. Исправить формулу расчета потери веса

**Файл**: `src/utils/calculations.js`

```javascript
// БЫЛО (НЕПРАВИЛЬНО):
const weightLossPerWeek = calorieDeficit / 1100; // ~1100 калорий = 1 кг жира

// ДОЛЖНО БЫТЬ (ПРАВИЛЬНО):
const weightLossPerWeek = (calorieDeficit * 7) / 7700; // 7700 калорий ≈ 1 кг жира
// calorieDeficit * 7 = дефицит за неделю
```

Полная исправленная функция:
```javascript
export const calculateWeightLossForecast = (
  currentWeight,
  goalWeight,
  pace,
  startDate = new Date()
) => {
  const forecast = [];
  const calorieDeficit = paceDeficits[pace];
  
  // Исправленная формула: 7700 калорий ≈ 1 кг жира
  const weeklyDeficit = calorieDeficit * 7;
  const weightLossPerWeek = weeklyDeficit / 7700;
  
  let currentDate = new Date(startDate);
  let weight = currentWeight;
  
  forecast.push({
    date: new Date(currentDate),
    weight: weight,
  });
  
  // Генерируем прогноз до достижения целевого веса
  const maxWeeks = 104;
  
  for (let week = 1; week <= maxWeeks; week++) {
    currentDate.setDate(currentDate.getDate() + 7);
    weight = Math.max(goalWeight, weight - weightLossPerWeek);
    
    forecast.push({
      date: new Date(currentDate),
      weight: parseFloat(weight.toFixed(1)),
    });
    
    if (weight <= goalWeight) break;
  }
  
  return forecast;
};
```

### 4. Исправить деление на ноль в calculateBMI

**Файл**: `src/utils/calculations.js`

```javascript
export const calculateBMI = (weight, height) => {
  if (!height || height <= 0) {
    throw new Error('Height must be greater than 0');
  }
  if (!weight || weight <= 0) {
    throw new Error('Weight must be greater than 0');
  }
  
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};
```

### 5. Добавить валидацию входных данных

Создайте файл `src/utils/validation.js`:

```javascript
export const VALIDATION_RULES = {
  weight: { min: 20, max: 300 }, // кг
  height: { min: 100, max: 250 }, // см
  age: { min: 10, max: 120 }, // лет
  waist: { min: 30, max: 200 }, // см
  hips: { min: 50, max: 200 }, // см
  neck: { min: 20, max: 60 }, // см
  thigh: { min: 30, max: 100 }, // см
};

export const validateNumber = (value, field) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Введите корректное число' };
  }
  
  const rules = VALIDATION_RULES[field];
  if (!rules) {
    return { valid: true, value: num };
  }
  
  if (num < rules.min || num > rules.max) {
    return {
      valid: false,
      error: `Значение должно быть от ${rules.min} до ${rules.max}`,
    };
  }
  
  return { valid: true, value: num };
};

export const validateDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Некорректная дата' };
  }
  
  if (date > now) {
    return { valid: false, error: 'Дата не может быть в будущем' };
  }
  
  return { valid: true, value: dateString };
};
```

Используйте в компонентах:
```javascript
// В AddEntryScreen.js
import { validateNumber, validateDate } from '../utils/validation';

const handleSave = async () => {
  // Валидация
  const weightValidation = validateNumber(weight, 'weight');
  if (!weightValidation.valid) {
    Alert.alert('Ошибка', weightValidation.error);
    return;
  }
  
  const dateValidation = validateDate(date);
  if (!dateValidation.valid) {
    Alert.alert('Ошибка', dateValidation.error);
    return;
  }
  
  // ... остальной код
};
```

## СЕРЬЕЗНЫЕ ИСПРАВЛЕНИЯ

### 6. Исправить Race Condition при сохранении

**Файл**: `src/screens/AddEntryScreen.js`

```javascript
export const AddEntryScreen = ({ entry, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Новый state
  
  const handleSave = async () => {
    // Защита от повторного вызова
    if (isSaving) return;
    
    if (!weight) {
      Alert.alert('Ошибка', 'Укажите вес');
      return;
    }

    setIsSaving(true);
    setLoading(true);
    
    try {
      // ... код сохранения
      onClose();
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };
  
  // ... остальной код
};
```

Или используйте debounce:
```javascript
import { useCallback, useRef } from 'react';

const handleSave = useCallback(
  debounce(async () => {
    // ... код сохранения
  }, 1000, { leading: true, trailing: false }),
  [/* dependencies */]
);
```

### 7. Исправить Memory Leak при unmount

**Файл**: `src/screens/DashboardScreen.js`

```javascript
export const DashboardScreen = ({ onAddEntry }) => {
  const [userData, setUserData] = useState(null);
  const [latestEntry, setLatestEntry] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const isMountedRef = useRef(true);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMountedRef.current) return;

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!isMountedRef.current) return;
      setUserData(userProfile);

      const { data: entries } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1);

      if (!isMountedRef.current) return;
      if (entries && entries.length > 0) {
        setLatestEntry(entries[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // ... остальной код
};
```

### 8. Обработка ошибок сети с retry

Создайте `src/utils/apiHelpers.js`:

```javascript
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Проверяем тип ошибки
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('Network request failed')) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }
};

// Использование:
const loadData = async () => {
  try {
    await withRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // ... остальной код
    });
  } catch (error) {
    Alert.alert(
      'Ошибка сети',
      'Не удалось загрузить данные. Проверьте подключение к интернету.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Повторить', onPress: () => loadData() },
      ]
    );
  }
};
```

### 9. Проверка на дублирующиеся записи по дате

**Файл**: `src/screens/AddEntryScreen.js`

```javascript
const handleSave = async () => {
  // ... валидация
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Пользователь не авторизован');
    
    if (!isEditing) {
      // Проверяем дубликаты по дате
      const { data: existingEntries } = await supabase
        .from('entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date);
      
      if (existingEntries && existingEntries.length > 0) {
        Alert.alert(
          'Запись существует',
          'На эту дату уже есть запись. Хотите обновить её?',
          [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Обновить',
              onPress: async () => {
                // Обновляем существующую запись
                await supabase
                  .from('entries')
                  .update(entryData)
                  .eq('id', existingEntries[0].id);
                onClose();
              },
            },
          ]
        );
        return;
      }
    }
    
    // ... остальной код сохранения
  } catch (error) {
    Alert.alert('Ошибка', error.message);
  } finally {
    setLoading(false);
  }
};
```

### 10. Исправить краш при пустом массиве entries

**Файл**: `src/screens/ChartsScreen.js`

```javascript
// БЫЛО:
const currentWeight = entries[entries.length - 1].weight;

// ДОЛЖНО БЫТЬ:
const currentWeight = entries.length > 0 
  ? entries[entries.length - 1].weight 
  : userData?.current_weight || 0;

// Или с optional chaining:
const currentWeight = entries[entries.length - 1]?.weight || userData?.current_weight || 0;
```

## СРЕДНИЕ ИСПРАВЛЕНИЯ

### 11. Улучшить Input компонент с валидацией

**Файл**: `src/components/Input.js`

```javascript
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

export const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  style,
  error,
  min,
  max,
}) => {
  const [localError, setLocalError] = useState('');

  const handleChange = (text) => {
    let processedText = text;
    
    // Заменяем запятую на точку для чисел
    if (keyboardType === 'numeric' || keyboardType === 'decimal-pad') {
      processedText = text.replace(',', '.');
      
      // Валидация диапазона
      if (processedText && !isNaN(parseFloat(processedText))) {
        const num = parseFloat(processedText);
        
        if (min !== undefined && num < min) {
          setLocalError(`Минимум ${min}`);
        } else if (max !== undefined && num > max) {
          setLocalError(`Максимум ${max}`);
        } else {
          setLocalError('');
        }
      }
    }
    
    onChangeText(processedText);
  };

  const displayError = error || localError;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          displayError && styles.inputError,
        ]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        keyboardType={keyboardType === 'numeric' ? 'decimal-pad' : keyboardType}
        placeholderTextColor={colors.textLight}
      />
      {displayError && (
        <Text style={styles.errorText}>{displayError}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  inputError: {
    borderColor: colors.error || '#FF0000',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: colors.error || '#FF0000',
    marginTop: 4,
  },
});
```

### 12. Добавить error boundary

Создайте `src/components/ErrorBoundary.js`:

```javascript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Здесь можно отправить в Sentry или другой сервис
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Что-то пошло не так</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Произошла неизвестная ошибка'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6B7D8A',
  },
  button: {
    backgroundColor: '#A8D8EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ErrorBoundary;
```

Оберните приложение в `App.js`:
```javascript
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  // ...
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* ... */}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
```

### 13. Добавить offline mode

Установите: `npm install @react-native-community/netinfo`

Создайте `src/hooks/useNetworkStatus.js`:

```javascript
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};
```

Используйте в компонентах:
```javascript
const DashboardScreen = ({ onAddEntry }) => {
  const isConnected = useNetworkStatus();
  
  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineText}>Нет подключения к интернету</Text>
        <Text style={styles.offlineSubtext}>
          Проверьте подключение и попробуйте снова
        </Text>
      </View>
    );
  }
  
  // ... остальной код
};
```

## РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ ПРОИЗВОДИТЕЛЬНОСТИ

### 14. Добавить React Query для кэширования

Установите: `npm install @tanstack/react-query`

```javascript
// src/hooks/useUserData.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useUserData = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

// Использование:
const DashboardScreen = ({ onAddEntry }) => {
  const { data: userData, isLoading, error } = useUserData();
  
  if (isLoading) return <Text>Загрузка...</Text>;
  if (error) return <Text>Ошибка: {error.message}</Text>;
  
  // ... остальной код
};
```

### 15. Оптимизировать компоненты с React.memo

```javascript
export const Card = React.memo(({ children, color, style }) => {
  return (
    <View style={[styles.card, { backgroundColor: color }, style]}>
      {children}
    </View>
  );
});

export const Input = React.memo(({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  style 
}) => {
  // ... компонент
});
```

## ИТОГО: Чеклист исправлений

- [ ] Переместить API ключи в .env
- [ ] Настроить RLS в Supabase
- [ ] Исправить формулу расчета потери веса (1100 -> 7700)
- [ ] Добавить валидацию делениня на ноль
- [ ] Добавить валидацию входных данных (диапазоны)
- [ ] Исправить race condition (debounce/disabled)
- [ ] Исправить memory leak (cleanup useEffect)
- [ ] Добавить retry logic для сетевых запросов
- [ ] Проверка дублирующихся записей по дате
- [ ] Исправить краш при пустом массиве entries
- [ ] Улучшить Input с валидацией
- [ ] Добавить ErrorBoundary
- [ ] Добавить offline mode
- [ ] Добавить React Query для кэширования
- [ ] Оптимизировать с React.memo

После выполнения всех исправлений, запустите тесты:
```bash
npm test
```

И проверьте покрытие:
```bash
npm run test:coverage
```
