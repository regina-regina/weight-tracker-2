import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { colors } from '../styles/colors';
import { supabase } from '../services/supabase';
import {
  calculateBMI,
  getBMICategory,
  calculateBodyFat,
  calculateBMR,
  calculateTDEE,
  calculateDailyCalories,
  calculateTimeToGoal,
  paceDeficits,
} from '../utils/calculations';

export const DashboardScreen = ({ onAddEntry }) => {
  const [userData, setUserData] = useState(null);
  const [latestEntry, setLatestEntry] = useState(null);
  const [latestEntryWithMeasurements, setLatestEntryWithMeasurements] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('users').select('*').eq('id', user.id).single();
      setUserData(userProfile);

      const { data: entries } = await supabase
        .from('entries').select('*').eq('user_id', user.id)
        .order('date', { ascending: false }).limit(1);
      if (entries && entries.length > 0) setLatestEntry(entries[0]);

      const { data: entriesForFat } = await supabase
        .from('entries').select('*').eq('user_id', user.id)
        .order('date', { ascending: false }).limit(50);
      const withMeasurements = (entriesForFat || []).find(
        (e) => e.waist && e.neck && (userProfile?.gender === 'male' || e.hips)
      );
      setLatestEntryWithMeasurements(withMeasurements || null);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // === SKELETON ===
  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.skelHero} />
          <View style={styles.skelRow}>
            <View style={[styles.skelSmall, { flex: 1 }]} />
            <View style={[styles.skelSmall, { flex: 1 }]} />
          </View>
          <View style={styles.skelRow}>
            <View style={[styles.skelSmall, { flex: 1 }]} />
            <View style={[styles.skelSmall, { flex: 1 }]} />
          </View>
          <View style={styles.skelHero} />
        </ScrollView>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ошибка загрузки</Text>
      </View>
    );
  }

  // === РАСЧЁТЫ ===
  const currentWeight = latestEntry ? latestEntry.weight : userData.current_weight;
  const weightToLose = currentWeight - userData.goal_weight;
  const bmi = calculateBMI(currentWeight, userData.height);
  const bmiCategory = getBMICategory(bmi);

  let bodyFatPercentage = null;
  if (latestEntryWithMeasurements) {
    const e = latestEntryWithMeasurements;
    const raw = calculateBodyFat(
      userData.gender, e.waist, e.neck, userData.height, e.hips
    );
    // Показываем абсолютный процент, ограничиваем 0–100 (формула иногда даёт отрицательные значения при некорректных замерах)
    bodyFatPercentage = raw != null ? Math.max(0, Math.min(100, raw)) : null;
  }

  const bmr = calculateBMR(userData.gender, currentWeight, userData.height, userData.age);
  const tdee = calculateTDEE(bmr, userData.activity_level);
  const dailyCalories = calculateDailyCalories(tdee, userData.pace);

  const initialWeight = userData.current_weight;
  const totalToLose = initialWeight - userData.goal_weight;
  const progressPercent = totalToLose > 0
    ? Math.min(100, Math.max(0, ((initialWeight - currentWeight) / totalToLose) * 100))
    : 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  // Цвет карточки ИМТ
  const bmiCardColor = bmi < 18.5 ? colors.pastelBlue : bmi < 25 ? colors.pastelMint : bmi < 30 ? colors.pastelYellow : colors.pastelCoral;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />}
      >

        {/* Приветствие */}
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.greetingSub}>Давайте проверим прогресс</Text>

        {/* === HERO карточка — вес + прогресс === */}
        <View style={styles.heroCard}>
          {/* Верхняя строка: эмодзи + вес */}
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Текущий вес</Text>
              <View style={styles.heroWeightRow}>
                <Text style={styles.heroWeight}>{currentWeight.toFixed(1)}</Text>
                <Text style={styles.heroUnit}>кг</Text>
              </View>
            </View>
            <Text style={styles.heroEmoji}>⚖️</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Метки: начальный вес у начала бара, целевой — у конца */}
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{initialWeight} кг</Text>
            <Text style={styles.progressLabel}>🎯 {userData.goal_weight} кг</Text>
          </View>

          {/* Остаток / достигнута */}
          {weightToLose > 0 ? (
            <Text style={styles.remainingText}>Осталось {weightToLose.toFixed(1)} кг</Text>
          ) : (
            <Text style={styles.achievedText}>🎉 Цель достигнута!</Text>
          )}
        </View>

        {/* === 2×2 плитки === */}
        <View style={styles.tileRow}>
          {/* ИМТ */}
          <View style={[styles.tile, { backgroundColor: bmiCardColor }]}>
            <Text style={styles.tileEmoji}>📊</Text>
            <Text style={styles.tileLabel}>ИМТ</Text>
            <Text style={styles.tileValue}>{bmi.toFixed(1)}</Text>
            <Text style={styles.tileSub}>{bmiCategory}</Text>
          </View>

          {/* Цель */}
          <View style={[styles.tile, { backgroundColor: colors.pastelYellow }]}>
            <Text style={styles.tileEmoji}>🎯</Text>
            <Text style={styles.tileLabel}>Цель</Text>
            <Text style={styles.tileValue}>{userData.goal_weight.toFixed(1)}</Text>
            <Text style={styles.tileSub}>кг</Text>
          </View>
        </View>

        <View style={styles.tileRow}>
          {/* Процент жира по последним замерам (абсолютная величина) */}
          <View style={[styles.tile, { backgroundColor: bodyFatPercentage !== null ? colors.pastelCoral : colors.pastelSage }]}>
            <Text style={styles.tileEmoji}>{bodyFatPercentage !== null ? '💪' : '📝'}</Text>
            <Text style={styles.tileLabel}>{bodyFatPercentage !== null ? 'Жир в теле' : 'Измерения'}</Text>
            <Text style={styles.tileValue}>{bodyFatPercentage !== null ? `${bodyFatPercentage.toFixed(1)} %` : '—'}</Text>
            <Text style={styles.tileSub}>{bodyFatPercentage !== null ? 'по последним замерам' : 'талия, шея, бёдра'}</Text>
          </View>

          {/* Калории — норма для цели */}
          <View style={[styles.tile, { backgroundColor: colors.pastelBlue }]}>
            <Text style={styles.tileEmoji}>🔥</Text>
            <Text style={styles.tileLabel}>Калории в день</Text>
            <Text style={styles.tileValue}>{Math.round(dailyCalories)}</Text>
            <Text style={styles.tileSub}>{weightToLose > 0 ? 'норма для похудения' : 'поддержание веса'}</Text>
          </View>
        </View>

        {/* === Плашка 1: Обмен и Расход === */}
        <View style={[styles.infoStrip, { backgroundColor: colors.pastelLavender }]}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Обмен</Text>
            <Text style={styles.infoValue}>{Math.round(bmr)}</Text>
            <Text style={styles.infoUnit}>ккал/день</Text>
          </View>
          <View style={styles.infoSep} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Расход</Text>
            <Text style={styles.infoValue}>{Math.round(tdee)}</Text>
            <Text style={styles.infoUnit}>ккал/день</Text>
          </View>
        </View>

        {/* === Плашка 2: Дефицит, Цель к, Темп === */}
        <View style={[styles.deficitStrip, { backgroundColor: colors.pastelPeach }]}>
          <View style={styles.deficitRow}>
            <Text style={styles.deficitLabel}>Дефицит в день</Text>
            <Text style={styles.deficitValue}>{weightToLose > 0 ? `${paceDeficits[userData.pace]} ккал` : '—'}</Text>
          </View>
          <View style={styles.deficitSep} />
          <View style={styles.deficitRow}>
            <Text style={styles.deficitLabel}>Цель к</Text>
            <Text style={styles.deficitValue}>
              {weightToLose > 0
                ? (() => {
                    const { weeks } = calculateTimeToGoal(currentWeight, userData.goal_weight, userData.pace);
                    const d = new Date();
                    d.setDate(d.getDate() + weeks * 7);
                    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
                  })()
                : '—'}
            </Text>
          </View>
          <View style={styles.deficitSep} />
          <View style={styles.deficitRow}>
            <Text style={styles.deficitLabel}>Темп</Text>
            <Text style={styles.deficitValue}>
              {userData.pace === 'fast' ? 'Быстр.' : userData.pace === 'optimal' ? 'Опт.' : 'Медл.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },

  // Skeleton
  skelHero: { height: 170, borderRadius: 24, backgroundColor: '#EDE8F0', marginBottom: 14 },
  skelRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  skelSmall: { height: 130, borderRadius: 20, backgroundColor: '#EDE8F0' },

  errorText: { fontSize: 16, color: '#E53935', textAlign: 'center', marginTop: 80, fontFamily: 'Montserrat_400Regular' },

  // Greeting
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  greetingSub: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    marginBottom: 20,
  },

  // Hero card
  heroCard: {
    backgroundColor: colors.pastelPink,
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    shadowColor: '#E8C0D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 3,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroWeightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroWeight: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    lineHeight: 54,
  },
  heroUnit: {
    fontSize: 18,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
  },
  heroEmoji: { fontSize: 40 },

  // Progress
  progressBar: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: colors.textSecondary },
  remainingText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: colors.primary },
  achievedText: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: colors.success },

  // 2×2 tiles
  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    minHeight: 130,
    shadowColor: '#D5CDE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  tileEmoji: { fontSize: 24, marginBottom: 8 },
  tileLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
  },
  tileSub: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary, marginTop: 2 },

  // Info strip
  infoStrip: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-around',
    shadowColor: '#D5CDE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: { alignItems: 'center', flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
  },
  infoUnit: {
    fontSize: 10,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoSep: { width: 1, height: 34, backgroundColor: 'rgba(43,32,53,0.1)' },

  deficitStrip: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#D5CDE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  deficitRow: { alignItems: 'center', flex: 1 },
  deficitLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  deficitValue: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: colors.textPrimary },
  deficitSep: { width: 1, height: 36, backgroundColor: 'rgba(43,32,53,0.12)' },
});
