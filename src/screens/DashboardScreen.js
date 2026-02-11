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
  const [activeCaloriesEntries, setActiveCaloriesEntries] = useState([]);
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

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      const { data: activeEntries } = await supabase
        .from('entries')
        .select('date, active_calories')
        .eq('user_id', user.id)
        .gte('date', monthStartStr)
        .lte('date', todayStr);
      setActiveCaloriesEntries(activeEntries || []);
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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];
  const weekStart = new Date(today);
  const dayOfWeek = weekStart.getDay();
  const toMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - toMonday);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const activeToday = activeCaloriesEntries
    .filter((e) => e.date === todayStr)
    .reduce((s, e) => s + (Number(e.active_calories) || 0), 0);
  const activeWeek = activeCaloriesEntries
    .filter((e) => e.date >= weekStartStr && e.date <= todayStr)
    .reduce((s, e) => s + (Number(e.active_calories) || 0), 0);
  const activeMonth = activeCaloriesEntries
    .reduce((s, e) => s + (Number(e.active_calories) || 0), 0);
  const showActiveCaloriesStrip = activeToday > 0 || activeWeek > 0 || activeMonth > 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const s = colors.semantic;

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

        {/* === HERO карточка — прогресс и цели (фиолетово-персиковая) === */}
        <View style={[styles.heroCard, { backgroundColor: s.progressHeroBg }, styles.cardShadow]}>
          <View style={styles.heroRow}>
            <View>
              <Text style={[styles.heroLabel, { color: s.progressHeroRemaining }]}>Текущий вес</Text>
              <View style={styles.heroWeightRow}>
                <Text style={[styles.heroWeight, { color: s.goalValue }]}>{currentWeight.toFixed(1)}</Text>
                <Text style={[styles.heroUnit, { color: s.progressHeroRemaining }]}>кг</Text>
              </View>
            </View>
            <Text style={styles.heroEmoji}>⚖️</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: 'rgba(123,95,184,0.25)' }]}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: s.progressHeroRemaining }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: s.progressHeroRemaining }]}>{initialWeight} кг</Text>
            <Text style={[styles.progressLabel, { color: s.progressHeroRemaining }]}>🎯 {userData.goal_weight} кг</Text>
          </View>
          {weightToLose > 0 ? (
            <Text style={[styles.remainingText, { color: s.progressHeroRemaining }]}>Осталось {weightToLose.toFixed(1)} кг</Text>
          ) : (
            <Text style={styles.achievedText}>🎉 Цель достигнута!</Text>
          )}
        </View>

        {/* === 2×2 плитки: ИМТ + Цель === */}
        <View style={styles.tileRow}>
          <View style={[styles.tile, { backgroundColor: s.bmiBg }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>📊</Text>
            <Text style={[styles.tileLabel, { color: s.bmiLabel }]}>ИМТ</Text>
            <Text style={[styles.tileValue, { color: s.bmiValue }]}>{bmi.toFixed(1)}</Text>
            <Text style={[styles.tileSub, { color: s.bmiSub }]}>{bmiCategory}</Text>
          </View>
          <View style={[styles.tile, { backgroundColor: s.goalBg }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>🎯</Text>
            <Text style={[styles.tileLabel, { color: s.goalLabel }]}>Цель</Text>
            <Text style={[styles.tileValue, { color: s.goalValue }]}>{userData.goal_weight.toFixed(1)}</Text>
            <Text style={[styles.tileSub, { color: s.goalValue }]}>кг</Text>
          </View>
        </View>

        <View style={styles.tileRow}>
          {/* % жира: опциональные данные — нейтральная/розовая гамма по наличию данных */}
          <View style={[styles.tile, { backgroundColor: (bodyFatPercentage != null && bodyFatPercentage > 0) ? s.fatFilledBg : s.fatEmptyBg }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>{bodyFatPercentage !== null && bodyFatPercentage > 0 ? '💪' : '📝'}</Text>
            <Text style={[styles.tileLabel, { color: (bodyFatPercentage != null && bodyFatPercentage > 0) ? s.fatFilledSub : s.fatEmptyValue }]}>
              {bodyFatPercentage !== null && bodyFatPercentage > 0 ? '% жира' : 'Измерения'}
            </Text>
            <Text style={[styles.tileValue, { color: (bodyFatPercentage != null && bodyFatPercentage > 0) ? s.fatFilledValue : s.fatEmptyValue }]}>
              {bodyFatPercentage === null
                ? 'Внести данные'
                : bodyFatPercentage === 0
                  ? 'Нет данных'
                  : bodyFatPercentage.toFixed(1)}
            </Text>
            <Text style={[styles.tileSub, { color: (bodyFatPercentage != null && bodyFatPercentage > 0) ? s.fatFilledSub : s.fatEmptySub }]}>
              {bodyFatPercentage !== null && bodyFatPercentage > 0 ? 'По замерам' : 'талия, шея, бёдра'}
            </Text>
          </View>
          <View style={[styles.tile, { backgroundColor: s.caloriesBg }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>🔥</Text>
            <Text style={[styles.tileLabel, { color: s.caloriesLabel }]}>Лимит калорий</Text>
            <Text style={[styles.tileValue, { color: s.caloriesValue }]}>{Math.round(dailyCalories)}</Text>
            <Text style={[styles.tileSub, { color: s.caloriesLabel }]}>{weightToLose > 0 ? 'дневная норма' : 'поддержание веса'}</Text>
          </View>
        </View>

        {/* === Базовый обмен / Общий расход (сине-фиолетовая) === */}
        <View style={[styles.infoStrip, { backgroundColor: s.bmrStripBg }, styles.cardShadow]}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: s.bmrStripLabel }]} numberOfLines={2} allowFontScaling={false}>Базовый обмен</Text>
            <Text style={[styles.infoValue, { color: s.bmrStripValue }]}>{Math.round(bmr)}</Text>
            <Text style={[styles.infoUnit, { color: s.bmrStripLabel }]}>ккал/день</Text>
          </View>
          <View style={[styles.infoSep, { backgroundColor: s.bmrStripSep }]} />
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: s.bmrStripLabel }]} numberOfLines={2} allowFontScaling={false}>Общий расход</Text>
            <Text style={[styles.infoValue, { color: s.bmrStripValue }]}>{Math.round(tdee)}</Text>
            <Text style={[styles.infoUnit, { color: s.bmrStripLabel }]}>ккал/день</Text>
          </View>
        </View>

        {/* === Темп / Дефицит / Достижение (жёлтая гамма) === */}
        <View style={[styles.deficitStrip, { backgroundColor: s.stripProgressBg }, styles.cardShadow]}>
          <View style={styles.deficitRow}>
            <Text style={[styles.deficitLabel, { color: s.stripProgressLabel }]} numberOfLines={2}>Темп похудения</Text>
            <Text style={[styles.deficitValue, { color: s.stripProgressValue }]}>
              {userData.pace === 'fast' ? 'Быстр.' : userData.pace === 'optimal' ? 'Опт.' : 'Медл.'}
            </Text>
          </View>
          <View style={styles.deficitSep} />
          <View style={styles.deficitRow}>
            <Text style={[styles.deficitLabel, { color: s.stripProgressLabel }]}>Дефицит</Text>
            <Text style={[styles.deficitValue, { color: s.stripProgressValue }]}>{weightToLose > 0 ? `${paceDeficits[userData.pace]} ккал` : '—'}</Text>
          </View>
          <View style={styles.deficitSep} />
          <View style={styles.deficitRow}>
            <Text style={[styles.deficitLabel, { color: s.stripProgressLabel }]}>Достижение</Text>
            <Text style={[styles.deficitValue, { color: s.stripProgressValue }]}>
              {weightToLose > 0
                ? (() => {
                    const { weeks } = calculateTimeToGoal(currentWeight, userData.goal_weight, userData.pace);
                    const d = new Date();
                    d.setDate(d.getDate() + weeks * 7);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}.${month}.${year}`;
                  })()
                : '—'}
            </Text>
          </View>
        </View>

        {showActiveCaloriesStrip && (
          <View style={[styles.activeCalStrip, { backgroundColor: s.activeCalBg }, styles.cardShadow]}>
            <View style={styles.activeCalRow}>
              <View style={styles.activeCalItem}>
                <Text style={[styles.activeCalTitle, { color: s.activeCalTitle }]}>Сегодня</Text>
                <Text style={[styles.activeCalValue, { color: s.activeCalValue }]}>{Math.round(activeToday)}</Text>
              </View>
              <View style={[styles.activeCalSep, { backgroundColor: s.activeCalSep }]} />
              <View style={styles.activeCalItem}>
                <Text style={[styles.activeCalTitle, { color: s.activeCalTitle }]}>Неделя</Text>
                <Text style={[styles.activeCalValue, { color: s.activeCalValue }]}>{Math.round(activeWeek)}</Text>
              </View>
              <View style={[styles.activeCalSep, { backgroundColor: s.activeCalSep }]} />
              <View style={styles.activeCalItem}>
                <Text style={[styles.activeCalTitle, { color: s.activeCalTitle }]}>Месяц</Text>
                <Text style={[styles.activeCalValue, { color: s.activeCalValue }]}>{Math.round(activeMonth)}</Text>
              </View>
            </View>
            <Text style={[styles.activeCalSubCommon, { color: s.activeCalSub }]}>Активных калорий</Text>
          </View>
        )}

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
  skelHero: { height: 170, borderRadius: colors.cardRadius, backgroundColor: '#EDE8F0', marginBottom: 14 },
  skelRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  skelSmall: { height: 130, borderRadius: colors.cardRadius, backgroundColor: '#EDE8F0' },

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

  cardShadow: { ...colors.cardShadow },
  heroCard: {
    borderRadius: colors.cardRadius,
    padding: 22,
    marginBottom: 14,
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

  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tile: {
    flex: 1,
    borderRadius: colors.cardRadius,
    padding: 18,
    minHeight: 130,
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

  infoStrip: {
    flexDirection: 'row',
    borderRadius: colors.cardRadius,
    padding: 18,
    justifyContent: 'space-around',
  },
  infoItem: { alignItems: 'center', flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
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
    borderRadius: colors.cardRadius,
    padding: 18,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  deficitRow: { alignItems: 'center', flex: 1 },
  deficitLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  deficitValue: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: colors.textPrimary },
  deficitSep: { width: 1, height: 36, backgroundColor: 'rgba(43,32,53,0.12)' },

  activeCalStrip: {
    borderRadius: colors.cardRadius,
    padding: 18,
    marginTop: 12,
  },
  activeCalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  activeCalItem: { alignItems: 'center', flex: 1 },
  activeCalTitle: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activeCalValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
  },
  activeCalSubCommon: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  activeCalSep: { width: 1, height: 36, backgroundColor: 'rgba(43,32,53,0.12)' },
});
