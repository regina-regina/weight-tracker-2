import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '../styles/colors';
import { supabase } from '../services/supabase';
import { calculateBodyFat } from '../utils/calculations';

const screenWidth = Dimensions.get('window').width;

export const ChartsScreen = () => {
  const [userData, setUserData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weightPeriod, setWeightPeriod] = useState('month');
  const [bodyFatPeriod, setBodyFatPeriod] = useState('month');

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userProfile } = await supabase.from('users').select('*').eq('id', user.id).single();
      setUserData(userProfile);
      const { data: entriesData } = await supabase
        .from('entries').select('*').eq('user_id', user.id)
        .order('date', { ascending: true });
      setEntries(entriesData || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.skelChart} />
          <View style={styles.skelChart} />
        </ScrollView>
      </View>
    );
  }

  if (!userData || entries.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyEmoji}>📈</Text>
        <Text style={styles.emptyTitle}>Пока мало данных</Text>
        <Text style={styles.emptySub}>Добавьте несколько записей — графики появятся автоматически</Text>
      </View>
    );
  }

  // === ФИЛЬТРАЦИЯ ===
  const filterByPeriod = (data, period) => {
    if (period === 'all') return data;
    const cutoff = new Date();
    if (period === 'week') cutoff.setDate(cutoff.getDate() - 7);
    else if (period === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
    return data.filter(e => new Date(e.date) >= cutoff);
  };

  const formatDateLabel = (dateStr) => {
    const [, month, day] = dateStr.split('-');
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;
  };

  // === ДАННЫЕ ГРАФИКА ВЕСА ===
  const filteredWeight = filterByPeriod(entries, weightPeriod);
  const weightValues = filteredWeight.length ? filteredWeight.map(e => e.weight) : [];
  const weightMin = weightValues.length ? Math.floor(Math.min(...weightValues) * 2) / 2 : 50;
  const weightMax = weightValues.length ? Math.ceil(Math.max(...weightValues) * 2) / 2 : 60;
  const weightData = filteredWeight.map((e, i) => ({
    value: e.weight,
    label: filteredWeight.length > 1 && i % Math.max(1, Math.ceil(filteredWeight.length / 6)) === 0 ? formatDateLabel(e.date) : '',
    date: formatDateLabel(e.date),
  }));

  // === ДАННЫЕ % ЖИРА ===
  const bodyFatEntries = entries.filter(e => e.waist && e.neck);
  const filteredBF = filterByPeriod(bodyFatEntries, bodyFatPeriod);
  const bodyFatData = filteredBF.map((e, i) => {
    const bf = calculateBodyFat(userData.gender, e.waist, e.neck, userData.height, e.hips);
    return {
      value: bf,
      label: i % Math.max(1, Math.ceil(filteredBF.length / 6)) === 0 ? formatDateLabel(e.date) : '',
      date: formatDateLabel(e.date),
    };
  });

  // === КОМПОНЕНТ: period selector (pill tabs) ===
  const PeriodSelector = ({ period, setPeriod, options }) => (
    <View style={styles.periodWrap}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.periodPill, period === opt.value && styles.periodPillActive]}
          onPress={() => setPeriod(opt.value)}
        >
          <Text style={[styles.periodText, period === opt.value && styles.periodTextActive]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const periodOpts = [
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: 'all', label: 'Все' },
  ];

  const formatKgLabel = (v) => Number(v).toFixed(1);

  const chartBase = (color, opts = {}) => ({
    width: opts.width ?? screenWidth - 64,
    height: 180,
    curved: true,
    areaChart: true,
    isAnimated: true,
    animationDuration: 900,
    startFillColor: color,
    startOpacity: 0.35,
    endFillColor: color,
    endOpacity: 0.05,
    color,
    thickness: 3,
    dataPointsColor: color,
    dataPointsRadius: 5,
    initialSpacing: 10,
    endSpacing: 10,
    noOfSections: opts.noOfSections ?? 4,
    maxValue: opts.maxValue,
    minValue: opts.minValue,
    yAxisColor: 'transparent',
    xAxisColor: '#EDE8F0',
    yAxisTextStyle: styles.axisText,
    xAxisLabelTextStyle: styles.axisText,
    yAxisLabelFormatter: opts.yAxisLabelFormatter ?? formatKgLabel,
    showVerticalLines: true,
    rulesColor: '#EDE8F0',
    rulesType: 'solid',
    adjustToWidth: !opts.scrollable,
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />}
      >

        {/* === ГРАФИК ВЕСА === */}
        <View style={[styles.chartCard, { backgroundColor: colors.pastelPink }]}>
          <Text style={styles.chartTitle}>📈 Изменение веса</Text>
          <PeriodSelector period={weightPeriod} setPeriod={setWeightPeriod} options={periodOpts} />
          {weightData.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll} contentContainerStyle={styles.chartScrollContent}>
              <View style={styles.chartBox}>
                <LineChart
                  {...chartBase(colors.chartPink, {
                    noOfSections: Math.max(2, Math.round((weightMax - weightMin) * 2)),
                    minValue: Math.max(30, weightMin - 1),
                    maxValue: weightMax + 1,
                    scrollable: true,
                    width: Math.max(screenWidth - 64, weightData.length * 44),
                    yAxisLabelFormatter: formatKgLabel,
                  })}
                  data={weightData}
                  spacing={44}
                  yAxisLabelWidth={36}
                  pointerConfig={{
                    pointerStripHeight: 140,
                    pointerStripColor: colors.textSecondary,
                    pointerStripWidth: 1.5,
                    pointerColor: colors.chartPink,
                    radius: 6,
                    pointerLabelWidth: 94,
                    pointerLabelHeight: 56,
                    activatePointersOnLongPress: false,
                    autoAdjustPointerLabelPosition: true,
                    pointerLabelComponent: (items) => (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipDate}>{items[0].date}</Text>
                        <Text style={styles.tooltipVal}>{Number(items[0].value).toFixed(1)} кг</Text>
                      </View>
                    ),
                  }}
                />
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>Добавьте ещё одну запись для графика</Text>
          )}
        </View>

        {/* === ГРАФИК % ЖИРА === */}
        {bodyFatData.length > 1 && (
          <View style={[styles.chartCard, { backgroundColor: colors.pastelMint }]}>
            <Text style={styles.chartTitle}>💪 Процент жира</Text>
            <PeriodSelector period={bodyFatPeriod} setPeriod={setBodyFatPeriod} options={periodOpts} />
            <View style={styles.chartBox}>
              <LineChart
                {...chartBase(colors.chartMint)}
                data={bodyFatData}
                spacing={Math.min(52, Math.max(22, (screenWidth - 100) / Math.max(1, bodyFatData.length)))}
                pointerConfig={{
                  pointerStripHeight: 140,
                  pointerStripColor: colors.textSecondary,
                  pointerStripWidth: 1.5,
                  pointerColor: colors.chartMint,
                  radius: 6,
                  pointerLabelWidth: 94,
                  pointerLabelHeight: 56,
                  activatePointersOnLongPress: false,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items) => (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipDate}>{items[0].date}</Text>
                      <Text style={styles.tooltipVal}>{items[0].value.toFixed(1)}%</Text>
                    </View>
                  ),
                }}
              />
            </View>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Skeleton
  skelChart: { height: 220, borderRadius: 24, backgroundColor: '#EDE8F0', marginBottom: 14 },

  // Empty
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: colors.background },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary, textAlign: 'center' },

  // Chart card
  chartCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#D5CDE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  chartTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Montserrat_700Bold', color: colors.textPrimary, marginBottom: 14 },
  chartBox: { marginTop: 6, overflow: 'hidden' },

  // Period selector — pill tabs
  periodWrap: {
    flexDirection: 'row',
    backgroundColor: '#F2ECF5',
    borderRadius: 16,
    padding: 3,
    marginBottom: 14,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 13,
  },
  periodPillActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: colors.textSecondary },
  periodTextActive: { fontFamily: 'Montserrat_600SemiBold', color: '#FFFFFF' },

  // Axis
  axisText: { fontSize: 10, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary },

  chartScroll: { marginTop: 6 },
  chartScrollContent: { paddingRight: 20 },
  tooltip: {
    backgroundColor: 'rgba(43,32,53,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingTop: 12,
    borderRadius: 10,
    marginLeft: -44,
    marginTop: 4,
  },
  tooltipVal: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#FFFFFF', marginTop: 4 },
  tooltipDate: { fontSize: 11, fontFamily: 'Montserrat_400Regular', color: '#CCC' },

  noDataText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary, textAlign: 'center', marginVertical: 30 },
});
