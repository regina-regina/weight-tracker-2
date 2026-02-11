import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors } from '../styles/colors';
import { activityLevels, paces, genders } from '../utils/constants';
import { supabase } from '../services/supabase';
import { getAuthErrorMessage } from '../utils/authMessages';

const TOTAL_STEPS = 4;

export const OnboardingScreen = ({ initialName, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState('female');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [pace, setPace] = useState('optimal');

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!gender) return 'Укажите пол';
        if (!age || isNaN(age) || Number(age) < 10 || Number(age) > 120)
          return 'Возраст должен быть от 10 до 120 лет';
        if (!height || isNaN(height) || Number(height) < 100 || Number(height) > 250)
          return 'Рост должен быть от 100 до 250 см';
        return null;
      case 2:
        if (!currentWeight || isNaN(currentWeight) || Number(currentWeight) < 20 || Number(currentWeight) > 500)
          return 'Текущий вес должен быть от 20 до 500 кг';
        if (!goalWeight || isNaN(goalWeight) || Number(goalWeight) < 20 || Number(goalWeight) > 500)
          return 'Целевой вес должен быть от 20 до 500 кг';
        if (Number(goalWeight) >= Number(currentWeight))
          return 'Целевой вес должен быть меньше текущего';
        return null;
      case 3:
        return activityLevel ? null : 'Выберите уровень активности';
      case 4:
        return pace ? null : 'Выберите темп похудения';
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) { Alert.alert('Проверьте данные', error); return; }
    if (step < TOTAL_STEPS) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Ошибка аутентификации');

      const { error: userError } = await supabase.from('users').upsert([{
        id: user.id,
        name: (initialName && initialName.trim()) || null,
        gender,
        age: parseInt(age),
        height: parseFloat(height),
        current_weight: parseFloat(currentWeight),
        goal_weight: parseFloat(goalWeight),
        activity_level: activityLevel,
        pace,
      }], { onConflict: 'id' });

      if (userError) throw userError;
      onComplete();
    } catch (error) {
      Alert.alert('Ошибка', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Эмодзи и подзаголовки для шагов
  const stepConfig = [
    { emoji: '👤', title: 'О себе', subtitle: 'Расскажите немного о себе' },
    { emoji: '🎯', title: 'Цели', subtitle: 'Какой вес вы хотите достичь?' },
    { emoji: '🏃', title: 'Активность', subtitle: 'Как часто вы занимаетесь?' },
    { emoji: '⚡', title: 'Темп', subtitle: 'С какой скоростью похудеть?' },
  ];

  const current = stepConfig[step - 1];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={true}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Hero-иллюстрация сверху */}
        <View style={styles.heroArea}>
          <Text style={styles.heroEmoji}>{current.emoji}</Text>
        </View>

        {/* Dots индикатор (как в рефе онбординга) */}
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
            />
          ))}
        </View>

        {/* Заголовок */}
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        {/* === Шаг 1 === */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionLabel}>Пол</Text>
            <View style={styles.genderRow}>
              {genders.map((g) => {
                const isSelected = gender === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.genderPill, isSelected && styles.genderPillActive]}
                    onPress={() => setGender(g.value)}
                  >
                    <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                      {g.value === 'male' ? '♂️' : '♀️'}  {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Input label="Возраст (лет)" value={age} onChangeText={setAge} placeholder="Например, 25" keyboardType="numeric" />
            <Input label="Рост (см)" value={height} onChangeText={setHeight} placeholder="Например, 165" keyboardType="numeric" />
          </View>
        )}

        {/* === Шаг 2 === */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Input label="Текущий вес (кг)" value={currentWeight} onChangeText={setCurrentWeight} placeholder="Например, 70" keyboardType="numeric" />
            <Input label="Целевой вес (кг)" value={goalWeight} onChangeText={setGoalWeight} placeholder="Например, 60" keyboardType="numeric" />

            {currentWeight && goalWeight && Number(currentWeight) > Number(goalWeight) && (
              <View style={styles.goalPreview}>
                <Text style={styles.goalPreviewText}>
                  Нужно похудеть на{' '}
                  <Text style={styles.goalPreviewBold}>{(Number(currentWeight) - Number(goalWeight)).toFixed(1)} кг</Text>
                </Text>
              </View>
            )}
          </View>
        )}

        {/* === Шаг 3 === */}
        {step === 3 && (
          <View style={styles.stepContent}>
            {activityLevels.map((level) => {
              const isSelected = activityLevel === level.value;
              return (
                <TouchableOpacity
                  key={level.value}
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => setActivityLevel(level.value)}
                >
                  <View style={styles.optionCardInner}>
                    <View style={styles.optionCardLeft}>
                      <Text style={[styles.optionCardTitle, isSelected && styles.optionCardTitleActive]}>{level.label}</Text>
                      <Text style={styles.optionCardDesc}>{level.description}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* === Шаг 4 === */}
        {step === 4 && (
          <View style={styles.stepContent}>
            {paces.map((p) => {
              const isSelected = pace === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => setPace(p.value)}
                >
                  <View style={styles.optionCardInner}>
                    <View style={styles.optionCardLeft}>
                      <Text style={[styles.optionCardTitle, isSelected && styles.optionCardTitleActive]}>{p.label}</Text>
                      <Text style={styles.optionCardDesc}>{p.description}</Text>
                    </View>
                    <View style={[styles.paceBadge, { backgroundColor: p.color }]}>
                      <Text style={styles.paceBadgeText}>{p.value === 'fast' ? '🔥' : p.value === 'optimal' ? '⚡' : '🌱'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Навигация */}
        <View style={styles.navRow}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>← Назад</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}

          <Button
            title={step === TOTAL_STEPS ? 'Завершить 🎉' : 'Далее'}
            onPress={handleNext}
            loading={loading}
            disabled={loading}
            style={styles.nextBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingTop: 88,
    alignItems: 'center',
  },

  // Hero emoji наверху
  heroArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroEmoji: {
    fontSize: 64,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8E2EE',
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dotDone: {
    backgroundColor: colors.tileMint,
  },

  // Заголовок
  title: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Контент шага
  stepContent: {
    width: '100%',
  },

  // Пол
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE8F0',
  },
  genderPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  genderText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textPrimary,
  },
  genderTextActive: {
    color: '#FFFFFF',
  },

  // Goal preview
  goalPreview: {
    marginTop: 4,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#E8F8F2',
    alignItems: 'center',
  },
  goalPreviewText: {
    fontSize: 15,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
  },
  goalPreviewBold: {
    fontFamily: 'Montserrat_700Bold',
    color: colors.success,
  },

  // Option cards (activity / pace)
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#EDE8F0',
    overflow: 'hidden',
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F3',
  },
  optionCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  optionCardLeft: { flex: 1 },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  optionCardTitleActive: {
    color: colors.primary,
  },
  optionCardDesc: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paceBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceBadgeText: {
    fontSize: 18,
  },

  // Навигация
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    width: '100%',
  },
  backBtn: {
    width: 100,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textSecondary,
  },
  nextBtn: {
    flex: 1,
    marginLeft: 12,
  },
});
