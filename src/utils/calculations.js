// Расчет ИМТ (Индекс Массы Тела)
export const calculateBMI = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) {
    throw new Error('Вес и рост должны быть положительными числами');
  }
  if (weight > 500 || height > 300) {
    throw new Error('Проверьте введенные данные');
  }
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

// Интерпретация ИМТ
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Недостаточный вес';
  if (bmi < 25) return 'Нормальный вес';
  if (bmi < 30) return 'Избыточный вес';
  return 'Ожирение';
};

// Расчет процента жировой массы (US Navy Method)
export const calculateBodyFat = (gender, waist, neck, height, hips = null) => {
  if (gender === 'male') {
    return (
      495 /
        (1.0324 -
          0.19077 * Math.log10(waist - neck) +
          0.15456 * Math.log10(height)) -
      450
    );
  } else {
    if (!hips) return null;
    return (
      495 /
        (1.29579 -
          0.35004 * Math.log10(waist + hips - neck) +
          0.221 * Math.log10(height)) -
      450
    );
  }
};

// Расчет базового метаболизма (BMR) по формуле Mifflin-St Jeor
export const calculateBMR = (gender, weight, height, age) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Множители уровня активности
export const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  extreme: 1.9,
};

// Расчет TDEE (Total Daily Energy Expenditure)
export const calculateTDEE = (bmr, activityLevel) => {
  return bmr * activityMultipliers[activityLevel];
};

// Дефицит калорий для разных темпов похудения
export const paceDeficits = {
  fast: 750,
  optimal: 500,
  slow: 250,
};

// Расчет рекомендуемого потребления калорий
export const calculateDailyCalories = (tdee, pace) => {
  return Math.max(1200, tdee - paceDeficits[pace]);
};

// Прогноз снижения веса
export const calculateWeightLossForecast = (
  currentWeight,
  goalWeight,
  pace,
  startDate = new Date()
) => {
  if (!currentWeight || !goalWeight || currentWeight <= 0 || goalWeight <= 0) {
    throw new Error('Вес должен быть положительным числом');
  }
  if (currentWeight <= goalWeight) {
    return [{ date: new Date(startDate), weight: currentWeight }];
  }

  const forecast = [];
  const calorieDeficit = paceDeficits[pace];
  const weightLossPerWeek = (calorieDeficit * 7) / 7700;

  let currentDate = new Date(startDate);
  let weight = currentWeight;

  forecast.push({
    date: new Date(currentDate),
    weight: weight,
  });

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

// Расчет времени до достижения цели
// ИСПРАВЛЕНО: формула была calorieDeficit / 1100, теперь (calorieDeficit * 7) / 7700
export const calculateTimeToGoal = (currentWeight, goalWeight, pace) => {
  const weightToLose = currentWeight - goalWeight;
  if (weightToLose <= 0) return { weeks: 0, months: 0 };

  const calorieDeficit = paceDeficits[pace];
  const weightLossPerWeek = (calorieDeficit * 7) / 7700;
  const weeksToGoal = weightToLose / weightLossPerWeek;

  return {
    weeks: Math.ceil(weeksToGoal),
    months: Math.ceil(weeksToGoal / 4),
  };
};
