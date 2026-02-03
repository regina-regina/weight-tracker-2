// Уровни активности
export const activityLevels = [
  { value: 'sedentary', label: 'Сидячий образ жизни', description: 'Мало или нет физической активности' },
  { value: 'light', label: 'Легкая активность', description: '1-3 дня в неделю' },
  { value: 'moderate', label: 'Умеренная активность', description: '3-5 дней в неделю' },
  { value: 'high', label: 'Высокая активность', description: '6-7 дней в неделю' },
  { value: 'extreme', label: 'Экстремальная активность', description: 'Физическая работа или 2 тренировки в день' },
];

// Темпы похудения
export const paces = [
  { value: 'fast', label: 'Быстрый', description: '~0.75 кг в неделю', color: '#FF99C8' },
  { value: 'optimal', label: 'Оптимальный', description: '~0.5 кг в неделю', color: '#7BDCA4' },
  { value: 'slow', label: 'Медленный', description: '~0.25 кг в неделю', color: '#C7A3FF' },
];

// Пол
export const genders = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];
