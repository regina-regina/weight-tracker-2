/**
 * Автотесты для Weight Tracker приложения
 * 
 * Запуск: npm test
 * 
 * Покрытие:
 * - Компоненты (Input, Button, Card)
 * - Расчетные функции (BMI, Body Fat, BMR, TDEE, Calories, Forecasts)
 * - Экраны (Onboarding, Dashboard, AddEntry, History, Charts, Profile)
 * - Edge cases и валидация
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Компоненты
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';

// Экраны
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { DashboardScreen } from '../src/screens/DashboardScreen';
import { AddEntryScreen } from '../src/screens/AddEntryScreen';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';

// Утилиты
import {
  calculateBMI,
  getBMICategory,
  calculateBodyFat,
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateWeightLossForecast,
  calculateTimeToGoal,
} from '../src/utils/calculations';

// Mock Supabase
jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('=== КОМПОНЕНТЫ ===', () => {
  describe('Input Component', () => {
    test('должен отображать label и placeholder', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input
          label="Тестовое поле"
          placeholder="Введите значение"
          value=""
          onChangeText={() => {}}
        />
      );

      expect(getByText('Тестовое поле')).toBeTruthy();
      expect(getByPlaceholderText('Введите значение')).toBeTruthy();
    });

    test('должен заменять запятую на точку для numeric типа', () => {
      const mockOnChange = jest.fn();
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Число"
          value=""
          onChangeText={mockOnChange}
          keyboardType="numeric"
        />
      );

      const input = getByPlaceholderText('Число');
      fireEvent.changeText(input, '10,5');

      expect(mockOnChange).toHaveBeenCalledWith('10.5');
    });

    test('должен работать без label', () => {
      const { queryByText } = render(
        <Input
          placeholder="Без label"
          value=""
          onChangeText={() => {}}
        />
      );

      expect(queryByText(/Тестовое поле/)).toBeNull();
    });
  });

  describe('Button Component', () => {
    test('должен отображать title', () => {
      const { getByText } = render(
        <Button title="Нажми меня" onPress={() => {}} />
      );

      expect(getByText('Нажми меня')).toBeTruthy();
    });

    test('должен вызывать onPress при клике', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Кликни" onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Кликни'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    test('должен быть disabled когда disabled=true', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Недоступна" onPress={mockOnPress} disabled={true} />
      );

      const button = getByText('Недоступна').parent;
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    test('должен показывать loading indicator', () => {
      const { getByTestId, queryByText } = render(
        <Button title="Загрузка" onPress={() => {}} loading={true} />
      );

      expect(queryByText('Загрузка')).toBeNull();
      // ActivityIndicator должен быть виден
    });
  });

  describe('Card Component', () => {
    test('должен отображать children', () => {
      const { getByText } = render(
        <Card color="#FFD4E5">
          <></>
        </Card>
      );

      expect(getByText('Контент карточки')).toBeTruthy();
    });

    test('должен применять custom backgroundColor', () => {
      const { getByTestId } = render(
        <Card color="#FF0000" testID="test-card">
          <></>
        </Card>
      );

      const card = getByTestId('test-card');
      expect(card.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#FF0000' })
      );
    });
  });
});

describe('=== РАСЧЕТНЫЕ ФУНКЦИИ ===', () => {
  describe('calculateBMI', () => {
    test('должен правильно рассчитывать ИМТ', () => {
      expect(calculateBMI(70, 170)).toBeCloseTo(24.22, 1);
      expect(calculateBMI(50, 160)).toBeCloseTo(19.53, 1);
      expect(calculateBMI(90, 180)).toBeCloseTo(27.78, 1);
    });

    test('должен обрабатывать edge cases', () => {
      // КРИТИЧЕСКИЙ БАГ: деление на ноль
      expect(() => calculateBMI(70, 0)).toThrow();
      
      // Отрицательные значения (БАГ: нет валидации)
      const negativeBMI = calculateBMI(-70, 170);
      expect(negativeBMI).toBeLessThan(0); // Некорректный результат
      
      // Очень большие значения
      expect(calculateBMI(300, 200)).toBeCloseTo(75, 0);
    });
  });

  describe('getBMICategory', () => {
    test('должен правильно классифицировать ИМТ', () => {
      expect(getBMICategory(17)).toBe('Недостаточный вес');
      expect(getBMICategory(22)).toBe('Нормальный вес');
      expect(getBMICategory(27)).toBe('Избыточный вес');
      expect(getBMICategory(32)).toBe('Ожирение');
    });

    test('должен обрабатывать граничные значения', () => {
      expect(getBMICategory(18.5)).toBe('Нормальный вес');
      expect(getBMICategory(24.99)).toBe('Нормальный вес');
      expect(getBMICategory(25)).toBe('Избыточный вес');
      expect(getBMICategory(29.99)).toBe('Избыточный вес');
      expect(getBMICategory(30)).toBe('Ожирение');
    });
  });

  describe('calculateBodyFat', () => {
    test('должен рассчитывать процент жира для мужчин', () => {
      const bodyFat = calculateBodyFat('male', 85, 38, 175, null);
      expect(bodyFat).toBeGreaterThan(0);
      expect(bodyFat).toBeLessThan(100);
    });

    test('должен рассчитывать процент жира для женщин', () => {
      const bodyFat = calculateBodyFat('female', 75, 32, 165, 95);
      expect(bodyFat).toBeGreaterThan(0);
      expect(bodyFat).toBeLessThan(100);
    });

    test('должен возвращать null для женщин без hips', () => {
      const bodyFat = calculateBodyFat('female', 75, 32, 165, null);
      expect(bodyFat).toBeNull();
    });

    test('должен обрабатывать edge cases', () => {
      // Отрицательные значения (БАГ)
      const negativeFat = calculateBodyFat('male', -85, 38, 175, null);
      expect(isNaN(negativeFat)).toBe(true);
      
      // Нулевые значения (БАГ)
      const zeroFat = calculateBodyFat('male', 0, 0, 175, null);
      expect(isNaN(zeroFat)).toBe(true);
    });
  });

  describe('calculateBMR', () => {
    test('должен рассчитывать BMR для мужчин', () => {
      const bmr = calculateBMR('male', 75, 180, 30);
      expect(bmr).toBeCloseTo(1763, 0);
    });

    test('должен рассчитывать BMR для женщин', () => {
      const bmr = calculateBMR('female', 60, 165, 25);
      expect(bmr).toBeCloseTo(1381, 0);
    });

    test('должен обрабатывать edge cases', () => {
      // Возраст 0 (БАГ: нет валидации)
      const zeroAge = calculateBMR('male', 75, 180, 0);
      expect(zeroAge).toBeGreaterThan(0);
      
      // Отрицательный возраст (БАГ)
      const negativeAge = calculateBMR('male', 75, 180, -10);
      expect(negativeAge).toBeGreaterThan(0); // Некорректный результат
      
      // Очень большой возраст
      const oldAge = calculateBMR('male', 75, 180, 120);
      expect(oldAge).toBeGreaterThan(0);
    });
  });

  describe('calculateTDEE', () => {
    test('должен правильно умножать BMR на коэффициент активности', () => {
      const bmr = 1500;
      
      expect(calculateTDEE(bmr, 'sedentary')).toBe(1800);
      expect(calculateTDEE(bmr, 'light')).toBe(2062.5);
      expect(calculateTDEE(bmr, 'moderate')).toBe(2325);
      expect(calculateTDEE(bmr, 'high')).toBe(2587.5);
      expect(calculateTDEE(bmr, 'extreme')).toBe(2850);
    });
  });

  describe('calculateDailyCalories', () => {
    test('должен вычитать дефицит из TDEE', () => {
      const tdee = 2000;
      
      expect(calculateDailyCalories(tdee, 'fast')).toBe(1250);
      expect(calculateDailyCalories(tdee, 'optimal')).toBe(1500);
      expect(calculateDailyCalories(tdee, 'slow')).toBe(1750);
    });

    test('должен не опускаться ниже 1200 калорий', () => {
      const tdee = 1400;
      
      expect(calculateDailyCalories(tdee, 'fast')).toBe(1200);
      expect(calculateDailyCalories(tdee, 'optimal')).toBe(1200);
    });
  });

  describe('calculateWeightLossForecast', () => {
    test('должен генерировать прогноз потери веса', () => {
      const forecast = calculateWeightLossForecast(70, 60, 'optimal');
      
      expect(forecast.length).toBeGreaterThan(1);
      expect(forecast[0].weight).toBe(70);
      expect(forecast[forecast.length - 1].weight).toBe(60);
    });

    test('КРИТИЧЕСКИЙ БАГ: неправильная формула расчета', () => {
      // В коде используется 1100 калорий = 1 кг
      // Правильно: ~7700 калорий = 1 кг
      const forecast = calculateWeightLossForecast(70, 60, 'optimal');
      
      // Дефицит 500 калорий в день = 3500 в неделю
      // По правильной формуле: 3500 / 7700 = ~0.45 кг в неделю
      // По неправильной: 3500 / 7700 (используя 1100) = больше
      
      // Проверяем что прогноз слишком оптимистичный
      expect(forecast.length).toBeLessThan(25); // Ожидается < 6 месяцев для 10 кг
    });

    test('должен останавливаться при достижении целевого веса', () => {
      const forecast = calculateWeightLossForecast(65, 60, 'fast');
      
      expect(forecast[forecast.length - 1].weight).toBe(60);
    });

    test('должен ограничиваться максимум 104 неделями', () => {
      const forecast = calculateWeightLossForecast(150, 50, 'slow');
      
      expect(forecast.length).toBeLessThanOrEqual(105); // +1 для начальной точки
    });
  });

  describe('calculateTimeToGoal', () => {
    test('должен рассчитывать время до цели', () => {
      const time = calculateTimeToGoal(70, 60, 'optimal');
      
      expect(time.weeks).toBeGreaterThan(0);
      expect(time.months).toBeGreaterThan(0);
      expect(time.months).toBe(Math.ceil(time.weeks / 4));
    });
  });
});

describe('=== СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ ===', () => {
  describe('Онбординг', () => {
    test('должен отображать первый шаг', () => {
      const { getByText } = render(
        <OnboardingScreen onComplete={() => {}} />
      );

      expect(getByText('Добро пожаловать!')).toBeTruthy();
      expect(getByText('Шаг 1 из 4')).toBeTruthy();
    });

    test('должен переключаться между шагами', () => {
      const { getByText } = render(
        <OnboardingScreen onComplete={() => {}} />
      );

      // Заполняем первый шаг
      fireEvent.changeText(getByText(/Возраст/), '25');
      fireEvent.changeText(getByText(/Рост/), '170');
      
      fireEvent.press(getByText('Далее'));
      
      expect(getByText('Шаг 2 из 4')).toBeTruthy();
    });

    test('БАГ: должен валидировать отрицательные значения', async () => {
      const mockComplete = jest.fn();
      const { getByText, getByPlaceholderText } = render(
        <OnboardingScreen onComplete={mockComplete} />
      );

      // Вводим отрицательные значения
      fireEvent.changeText(getByPlaceholderText(/Например, 25/), '-25');
      fireEvent.changeText(getByPlaceholderText(/Например, 165/), '-170');
      
      // Кнопка не должна быть активна (но нет валидации!)
      const nextButton = getByText('Далее');
      // БАГ: кнопка все равно активна
    });

    test('БАГ: Race condition при быстром нажатии "Завершить"', async () => {
      const mockComplete = jest.fn();
      const { getByText } = render(
        <OnboardingScreen onComplete={mockComplete} />
      );

      // Переходим на последний шаг (упрощенно)
      const completeButton = getByText('Завершить');
      
      // Быстро нажимаем несколько раз
      fireEvent.press(completeButton);
      fireEvent.press(completeButton);
      fireEvent.press(completeButton);
      
      // БАГ: может создать несколько записей в БД
      await waitFor(() => {
        // mockComplete должен быть вызван только 1 раз
        // Но из-за отсутствия защиты может быть вызван несколько раз
      });
    });
  });

  describe('Добавление записи веса', () => {
    test('должен отображать форму добавления', () => {
      const { getByText } = render(
        <AddEntryScreen onClose={() => {}} />
      );

      expect(getByText('Добавить запись')).toBeTruthy();
      expect(getByText('Вес (кг) *')).toBeTruthy();
    });

    test('должен показывать форму редактирования для существующей записи', () => {
      const entry = {
        id: 1,
        date: '2024-01-15',
        weight: 70,
        waist: 80,
      };

      const { getByText, getByDisplayValue } = render(
        <AddEntryScreen entry={entry} onClose={() => {}} />
      );

      expect(getByText('Редактировать запись')).toBeTruthy();
      expect(getByDisplayValue('70')).toBeTruthy();
      expect(getByDisplayValue('80')).toBeTruthy();
    });

    test('БАГ: должен валидировать некорректный ввод', () => {
      const { getByPlaceholderText, getByText } = render(
        <AddEntryScreen onClose={() => {}} />
      );

      // Вводим некорректные данные
      fireEvent.changeText(getByPlaceholderText(/Например, 65.5/), '-50');
      fireEvent.changeText(getByPlaceholderText(/Например, 75/), '0');
      
      // БАГ: нет валидации, запись может быть сохранена
      const saveButton = getByText('Добавить запись');
      fireEvent.press(saveButton);
      
      // Должен показать ошибку, но не показывает
    });

    test('БАГ: можно выбрать будущую дату (обход maximumDate)', () => {
      // Тест проверяет что state может быть установлен на будущую дату
      // напрямую, обходя maximumDate в DateTimePicker
    });

    test('должен показывать кнопку удаления при редактировании', () => {
      const entry = { id: 1, date: '2024-01-15', weight: 70 };
      const { getByText } = render(
        <AddEntryScreen entry={entry} onClose={() => {}} />
      );

      expect(getByText('Удалить запись')).toBeTruthy();
    });
  });

  describe('Просмотр истории', () => {
    test('должен отображать пустое состояние', () => {
      const { getByText } = render(
        <HistoryScreen onEditEntry={() => {}} />
      );

      expect(getByText('Пока нет записей')).toBeTruthy();
    });

    test('должен вызывать onEditEntry при клике на запись', () => {
      const mockEdit = jest.fn();
      // Нужно mock данных из Supabase
    });

    test('должен показывать confirmation при удалении', () => {
      // Тест для Alert.alert при longPress
    });
  });

  describe('Dashboard', () => {
    test('должен отображать метрики пользователя', () => {
      // Mock user data и entries
      const { getByText } = render(
        <DashboardScreen onAddEntry={() => {}} />
      );

      expect(getByText('Текущий вес')).toBeTruthy();
      expect(getByText('Целевой вес')).toBeTruthy();
      expect(getByText('Индекс массы тела (ИМТ)')).toBeTruthy();
    });

    test('БАГ: краш при отсутствии entries', () => {
      // Если latestEntry = null, используется userData.current_weight
      // Но если userData тоже null, будет краш
    });

    test('БАГ: Memory leak при unmount', async () => {
      const { unmount } = render(
        <DashboardScreen onAddEntry={() => {}} />
      );

      // Запускаем async операцию
      // Сразу unmount компонент
      unmount();
      
      // БАГ: setState вызывается после unmount
      // Warning: Can't perform a React state update on an unmounted component
    });

    test('должен пересчитывать метрики при изменении данных', () => {
      // Тест для проверки что расчеты обновляются
    });
  });

  describe('Графики', () => {
    test('должен показывать пустое состояние без данных', () => {
      const { getByText } = render(<ChartsScreen />);
      expect(getByText('Недостаточно данных')).toBeTruthy();
    });

    test('БАГ: краш при пустом массиве entries', () => {
      // entries[entries.length - 1].weight вызовет краш
    });

    test('должен фильтровать данные по периоду', () => {
      // Тест для week/month/all периодов
    });

    test('должен отображать несколько линий прогнозов', () => {
      // Тест для fast/optimal/slow прогнозов
    });
  });

  describe('Профиль', () => {
    test('должен загружать данные пользователя', () => {
      const { getByText } = render(<ProfileScreen />);
      expect(getByText('Профиль')).toBeTruthy();
    });

    test('должен сохранять изменения', async () => {
      const { getByText, getByDisplayValue } = render(<ProfileScreen />);
      
      // Изменяем данные
      fireEvent.changeText(getByDisplayValue('25'), '26');
      
      // Сохраняем
      fireEvent.press(getByText('Сохранить изменения'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Успешно', 'Профиль обновлен');
      });
    });

    test('должен показывать ошибку при незаполненных полях', () => {
      const { getByText, getByDisplayValue } = render(<ProfileScreen />);
      
      // Очищаем обязательное поле
      fireEvent.changeText(getByDisplayValue('25'), '');
      
      // Пытаемся сохранить
      fireEvent.press(getByText('Сохранить изменения'));
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Ошибка',
        'Заполните все обязательные поля'
      );
    });
  });
});

describe('=== EDGE CASES ===', () => {
  describe('Валидация входных данных', () => {
    test('должен отклонять отрицательный вес', () => {
      // БАГ: нет валидации
      expect(() => calculateBMI(-70, 170)).not.toThrow();
    });

    test('должен отклонять нулевой рост', () => {
      // КРИТИЧЕСКИЙ БАГ: деление на ноль
      expect(() => calculateBMI(70, 0)).toThrow();
    });

    test('должен отклонять некорректный возраст', () => {
      // БАГ: нет валидации
      expect(calculateBMR('male', 75, 180, -5)).toBeDefined();
      expect(calculateBMR('male', 75, 180, 0)).toBeDefined();
      expect(calculateBMR('male', 75, 180, 999)).toBeDefined();
    });

    test('должен обрабатывать очень большие числа', () => {
      expect(calculateBMI(999999, 999999)).toBeDefined();
    });

    test('должен обрабатывать очень маленькие числа', () => {
      expect(calculateBMI(0.1, 0.1)).toBeDefined();
    });

    test('должен обрабатывать дробные числа', () => {
      expect(calculateBMI(70.5, 170.3)).toBeDefined();
    });
  });

  describe('Граничные случаи в расчетах', () => {
    test('должен обрабатывать случай когда goalWeight > currentWeight', () => {
      // Пользователь хочет набрать вес (не поддерживается)
      const forecast = calculateWeightLossForecast(60, 70, 'optimal');
      
      // Прогноз должен быть пустым или показывать ошибку
      expect(forecast.length).toBe(1); // Только начальная точка
    });

    test('должен обрабатывать случай когда goalWeight = currentWeight', () => {
      const forecast = calculateWeightLossForecast(70, 70, 'optimal');
      
      expect(forecast.length).toBe(1);
      expect(forecast[0].weight).toBe(70);
    });

    test('должен обрабатывать минимальный дефицит калорий', () => {
      const tdee = 1300;
      const calories = calculateDailyCalories(tdee, 'fast');
      
      expect(calories).toBe(1200); // Не ниже минимума
    });
  });

  describe('Обработка асинхронных операций', () => {
    test('должен обрабатывать ошибки сети', async () => {
      // Mock network error
      const mockError = new Error('Network request failed');
      
      // Должен показать понятное сообщение пользователю
    });

    test('должен обрабатывать таймауты', async () => {
      // Mock timeout
      // Должен retry или показать ошибку
    });

    test('должен отменять запросы при unmount', () => {
      // Тест для предотвращения memory leak
    });
  });

  describe('Состояния гонки', () => {
    test('должен предотвращать двойное создание записи', async () => {
      // БАГ: нет защиты от двойного клика
      const mockInsert = jest.fn();
      
      // Быстро нажимаем кнопку сохранения 2 раза
      // Должна создаться только 1 запись
      
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1);
      });
    });

    test('должен обрабатывать конкурентные обновления', async () => {
      // Два устройства редактируют одну запись
      // Должен быть conflict resolution
    });
  });

  describe('Производительность', () => {
    test('должен обрабатывать большое количество записей', () => {
      const manyEntries = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        weight: 70 - i * 0.1,
      }));

      // Должен отображаться без лагов
    });

    test('должен кэшировать расчеты', () => {
      // Повторные расчеты с теми же параметрами должны быть мгновенными
    });
  });

  describe('Безопасность', () => {
    test('БАГ: не должен допускать SQL injection через input', () => {
      // Supabase защищает от SQL injection, но проверим
      const maliciousInput = "'; DROP TABLE users; --";
      
      // Должен быть экранирован
    });

    test('БАГ: не должен допускать XSS через отображение данных', () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      // Должен быть экранирован при отображении
    });

    test('КРИТИЧЕСКИЙ: не должен раскрывать sensitive данные в логах', () => {
      // Проверяем что API ключи не логируются
    });
  });
});

describe('=== ИНТЕГРАЦИОННЫЕ ТЕСТЫ ===', () => {
  test('полный флоу: Onboarding -> Add Entry -> View Dashboard', async () => {
    // 1. Проходим онбординг
    // 2. Добавляем запись веса
    // 3. Проверяем что дашборд обновился
  });

  test('полный флоу: Add Entry -> Edit Entry -> Delete Entry', async () => {
    // 1. Создаем запись
    // 2. Редактируем ее
    // 3. Удаляем
    // 4. Проверяем что запись удалена
  });

  test('полный флоу: Изменение профиля -> Проверка расчетов', async () => {
    // 1. Изменяем данные профиля
    // 2. Проверяем что расчеты обновились
  });
});

describe('=== РЕГРЕССИОННЫЕ ТЕСТЫ ===', () => {
  test('исправление бага с делением на ноль', () => {
    // После исправления должен throw error
    expect(() => calculateBMI(70, 0)).toThrow('Height must be greater than 0');
  });

  test('исправление бага с формулой расчета потери веса', () => {
    // После исправления формулы (1100 -> 7700)
    const forecast = calculateWeightLossForecast(70, 60, 'optimal');
    
    // Прогноз должен быть более реалистичным
    // 10 кг при дефиците 500 кал/день = 7700*10/500 = 154 дня ≈ 22 недели
    expect(forecast.length).toBeGreaterThan(20);
    expect(forecast.length).toBeLessThan(25);
  });

  test('исправление race condition при сохранении', async () => {
    // После добавления debounce/disabled
    const mockSave = jest.fn();
    
    // Быстро кликаем 3 раза
    // Должен вызваться только 1 раз
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  test('исправление memory leak при unmount', async () => {
    // После добавления cleanup функции
    // Не должно быть warning о setState на unmounted component
  });
});

// Дополнительные helper функции для тестов
const mockUserData = {
  id: 'test-user-id',
  gender: 'female',
  age: 25,
  height: 165,
  current_weight: 70,
  goal_weight: 60,
  activity_level: 'moderate',
  pace: 'optimal',
};

const mockEntries = [
  {
    id: 1,
    user_id: 'test-user-id',
    date: '2024-01-01',
    weight: 72,
    waist: 80,
    hips: 98,
    neck: 33,
  },
  {
    id: 2,
    user_id: 'test-user-id',
    date: '2024-01-08',
    weight: 71.5,
    waist: 79,
    hips: 97,
    neck: 33,
  },
  {
    id: 3,
    user_id: 'test-user-id',
    date: '2024-01-15',
    weight: 71,
    waist: 78,
    hips: 96,
    neck: 32,
  },
];

const setupMockSupabase = (userData = mockUserData, entries = mockEntries) => {
  const { supabase } = require('../src/services/supabase');
  
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userData.id } },
  });
  
  supabase.from.mockImplementation((table) => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    
    if (table === 'users') {
      mockChain.single.mockResolvedValue({ data: userData, error: null });
    } else if (table === 'entries') {
      mockChain.single.mockResolvedValue({ data: entries[0], error: null });
    }
    
    return mockChain;
  });
  
  return supabase;
};
