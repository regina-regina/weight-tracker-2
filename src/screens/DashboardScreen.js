import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { AppColors } from '../styles/colors';
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />}
      >

        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.greetingSub}>Давайте проверим прогресс</Text>

        {/* Карточка 1: Осталось X кг — coralAccent, текст white */}
        <View style={[styles.heroCard, styles.cardShadow]}>
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
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{initialWeight} кг</Text>
            <Text style={styles.progressLabel}>🎯 {userData.goal_weight} кг</Text>
          </View>
          {weightToLose > 0 ? (
            <Text style={styles.remainingText}>Осталось {weightToLose.toFixed(1)} кг</Text>
          ) : (
            <Text style={styles.achievedText}>🎉 Цель достигнута!</Text>
          )}
        </View>

        <View style={styles.tileRow}>
          <View style={[styles.tile, { backgroundColor: AppColors.sageMintLight }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>📊</Text>
            <Text style={[styles.tileLabel, { color: AppColors.deepSea }]}>ИМТ</Text>
            <Text style={[styles.tileValue, { color: AppColors.textPrimary }]}>{bmi.toFixed(1)}</Text>
            <Text style={[styles.tileSub, { color: AppColors.bmiSub }]}>{bmiCategory}</Text>
          </View>
          <View style={[styles.tile, { backgroundColor: AppColors.peachyLight }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>🎯</Text>
            <Text style={[styles.tileLabel, { color: AppColors.goalTitle }]}>Цель</Text>
            <Text style={[styles.tileValue, { color: AppColors.textPrimary }]}>{userData.goal_weight.toFixed(1)}</Text>
            <Text style={[styles.tileSub, { color: AppColors.goalTitle }]}>кг</Text>
          </View>
        </View>

        <View style={styles.tileRow}>
          <View style={[styles.tile, { backgroundColor: (bodyFatPercentage != null && bodyFatPercentage > 0) ? AppColors.softBlush : AppColors.cloudCream }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>{bodyFatPercentage !== null && bodyFatPercentage > 0 ? '💪' : '📝'}</Text>
            <Text style={[styles.tileLabel, { color: (bodyFatPercentage != null && bodyFatPercentage > 0) ? AppColors.deepSea : AppColors.textSecondary }]}>
              {bodyFatPercentage !== null && bodyFatPercentage > 0 ? '% жира' : 'Измерения'}
            </Text>
            <Text style={[styles.tileValue, { color: (bodyFatPercentage != null && bodyFatPercentage > 0) ? AppColors.textPrimary : AppColors.fatEmptyValue }]}>
              {bodyFatPercentage === null ? 'Внести данные' : bodyFatPercentage === 0 ? 'Нет данных' : bodyFatPercentage.toFixed(1)}
            </Text>
            <Text style={[styles.tileSub, { color: (bodyFatPercentage != null && bodyFatPercentage > 0) ? AppColors.fatFilledSub : AppColors.inactive }]}>
              {bodyFatPercentage !== null && bodyFatPercentage > 0 ? 'По замерам' : 'талия, шея, бёдра'}
            </Text>
          </View>
          <View style={[styles.tile, { backgroundColor: AppColors.blueLight }, styles.cardShadow]}>
            <Text style={styles.tileEmoji}>🔥</Text>
            <Text style={[styles.tileLabel, { color: AppColors.deepSea }]}>Лимит калорий</Text>
            <Text style={[styles.tileValue, { color: AppColors.textPrimary }]}>{Math.round(dailyCalories)}</Text>
            <Text style={[styles.tileSub, { color: AppColors.caloriesSub }]}>{weightToLose > 0 ? 'дневная норма' : 'поддержание веса'}</Text>
          </View>
        </View>

        <View style={[styles.infoStrip, { backgroundColor: AppColors.beigeWarm }, styles.cardShadow]}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: AppColors.bmrStripTitle }]} numberOfLines={2} allowFontScaling={false}>Базовый обмен</Text>
            <Text style={[styles.infoValue, { color: AppColors.textPrimary }]}>{Math.round(bmr)}</Text>
            <Text style={[styles.infoUnit, { color: AppColors.bmrStripSub }]}>ккал/день</Text>
          </View>
          <View style={[styles.infoSep, { backgroundColor: AppColors.bmrStripDivider }]} />
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: AppColors.bmrStripTitle }]} numberOfLines={2} allowFontScaling={false}>Общий расход</Text>
            <Text style={[styles.infoValue, { color: AppColors.textPrimary }]}>{Math.round(tdee)}</Text>
            <Text style={[styles.infoUnit, { color: AppColors.bmrStripSub }]}>ккал/день</Text>
          </View>
        </View>

        <View style={[styles.deficitStrip, { backgroundColor: AppColors.peachyLight }, styles.cardShadow]}>
          <View style={styles.deficitRow}>
            <Text style={[styles.deficitLabel, { color: AppColors.goalTitle }]} numberOfLines={2}>Темп похудения</Text>
            <Text style={[styles.deficitValue, { color: AppColors.textPrimary }]}>
              {userData.pace === 'fast' ? 'Быстр.' : userData.pace === 'optimal' ? 'Опт.' : 'Медл.'}
            </Text>
          </View>
          <View style={[styles.deficitSep, { backgroundColor: AppColors.deficitStripDivider }]} />
          <View style={styles.deficitRow}>
            <Text style={[styles.deficitLabel, { color: AppColors.goalTitle }]}>Дефицит</Text>
            <Text style={[styles.deficitValue, { color: AppColors.textPrimary }]}>{weightToLose > 0 ? `${paceDeficits[userData.pace]} ккал` : '—'}</Text>
          </View>
          <View style={[styles.deficitSep, { backgroundColor: AppColors.deficitStripDivider }]} />
          <View style={styles.deficitRow}>
            <Text style={[styles.deficitLabel, { color: AppColors.goalTitle }]}>Достижение</Text>
            <Text style={[styles.deficitValue, { color: AppColors.textPrimary }]}>
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
          <View style={[styles.activeCalStrip, { backgroundColor: AppColors.sageMintLight }, styles.cardShadow]}>
            <View style={styles.activeCalRow}>
              <View style={styles.activeCalItem}>
                <Text style={[styles.activeCalTitle, { color: AppColors.deepSea }]}>Сегодня</Text>
                <Text style={[styles.activeCalValue, { color: AppColors.textPrimary }]}>{Math.round(activeToday)}</Text>
              </View>
              <View style={[styles.activeCalSep, { backgroundColor: AppColors.activeCalDivider }]} />
              <View style={styles.activeCalItem}>
                <Text style={[styles.activeCalTitle, { color: AppColors.deepSea }]}>Неделя</Text>
                <Text style={[styles.activeCalValue, { color: AppColors.textPrimary }]}>{Math.round(activeWeek)}</Text>
              </View>
              <View style={[styles.activeCalSep, { backgroundColor: AppColors.activeCalDivider }]} />
              <View style={styles.activeCalItem}>
                <Text style={[styles.activeCalTitle, { color: AppColors.deepSea }]}>Месяц</Text>
                <Text style={[styles.activeCalValue, { color: AppColors.textPrimary }]}>{Math.round(activeMonth)}</Text>
              </View>
            </View>
            <Text style={[styles.activeCalSubCommon, { color: AppColors.activeCalSub }]}>Активных калорий</Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.screenBackground },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },

  skelHero: { height: 170, borderRadius: AppColors.cardRadius, backgroundColor: AppColors.cloudCream, marginBottom: 14 },
  skelRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  skelSmall: { height: 130, borderRadius: AppColors.cardRadius, backgroundColor: AppColors.cloudCream },

  errorText: { fontSize: 16, color: AppColors.warningRed, textAlign: 'center', marginTop: 80, fontFamily: 'Montserrat_400Regular' },

  greeting: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  greetingSub: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: AppColors.textSecondary,
    marginBottom: 20,
  },

  cardShadow: { ...AppColors.cardShadow },
  heroCard: {
    backgroundColor: AppColors.coralAccent,
    borderRadius: AppColors.cardRadius,
    padding: 16,
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
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.white,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroWeightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroWeight: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: AppColors.white,
    lineHeight: 54,
  },
  heroUnit: {
    fontSize: 18,
    fontFamily: 'Montserrat_500Medium',
    color: AppColors.white,
  },
  heroEmoji: { fontSize: 40 },

  progressBar: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.white,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: AppColors.white },
  remainingText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: AppColors.white },
  achievedText: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: AppColors.white },

  tileRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tile: {
    flex: 1,
    borderRadius: AppColors.cardRadius,
    padding: 16,
    minHeight: 130,
  },
  tileEmoji: { fontSize: 24, marginBottom: 8 },
  tileLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
  },
  tileSub: { fontSize: 12, fontFamily: 'Montserrat_400Regular', marginTop: 2 },

  infoStrip: {
    flexDirection: 'row',
    borderRadius: AppColors.cardRadius,
    padding: 16,
    justifyContent: 'space-around',
  },
  infoItem: { alignItems: 'center', flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
  },
  infoUnit: { fontSize: 10, fontFamily: 'Montserrat_400Regular', marginTop: 2 },
  infoSep: { width: 1, height: 34 },

  deficitStrip: {
    flexDirection: 'row',
    borderRadius: AppColors.cardRadius,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  deficitRow: { alignItems: 'center', flex: 1 },
  deficitLabel: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  deficitValue: { fontSize: 15, fontFamily: 'Montserrat_700Bold' },
  deficitSep: { width: 1, height: 36 },

  activeCalStrip: {
    borderRadius: AppColors.cardRadius,
    padding: 16,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  activeCalValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
  },
  activeCalSubCommon: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 10,
    textAlign: 'center',
  },
  activeCalSep: { width: 1, height: 36 },
});
