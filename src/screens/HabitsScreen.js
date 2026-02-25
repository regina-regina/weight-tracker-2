import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { PersonStanding, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { AppColors } from '../styles/colors';
import { supabase } from '../services/supabase';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function getDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCurrentMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

function getMonthStartEnd(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { start: getDateStr(first), end: getDateStr(last) };
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const daysInMonth = last.getDate();
  const startWeekday = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = (date.getDay() + 6) % 7;
    cells.push({
      dateStr: getDateStr(date),
      dayNum: d,
      dayShort: WEEKDAY_LABELS[dayOfWeek],
    });
  }
  return cells;
}

export const HabitsScreen = ({ activeTab, openAddHabitModal, onCloseAddHabitModal }) => {
  const [habits, setHabits] = useState([]);
  const [logsByHabit, setLogsByHabit] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [viewedMonth, setViewedMonth] = useState(getCurrentMonth);
  const prevActiveTab = useRef(activeTab);

  useEffect(() => {
    if (openAddHabitModal) {
      setModalVisible(true);
      onCloseAddHabitModal?.();
    }
  }, [openAddHabitModal, onCloseAddHabitModal]);

  useEffect(() => {
    if (prevActiveTab.current !== 'habits' && activeTab === 'habits') {
      setViewedMonth(getCurrentMonth());
    }
    prevActiveTab.current = activeTab;
  }, [activeTab]);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: habitsList, error: habitsErr } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (habitsErr) throw habitsErr;
      setHabits(habitsList || []);

      const { start, end } = getMonthStartEnd(viewedMonth.year, viewedMonth.month);
      const { data: logs, error: logsErr } = await supabase
        .from('habit_logs')
        .select('habit_id, log_date')
        .eq('user_id', user.id)
        .gte('log_date', start)
        .lte('log_date', end);

      if (logsErr) throw logsErr;

      const byHabit = {};
      (logs || []).forEach((row) => {
        if (!byHabit[row.habit_id]) byHabit[row.habit_id] = new Set();
        byHabit[row.habit_id].add(row.log_date);
      });
      setLogsByHabit(byHabit);
    } catch (error) {
      console.error('Habits load error:', error);
    } finally {
      setLoading(false);
    }
  }, [viewedMonth.year, viewedMonth.month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const goPrevMonth = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setViewedMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  }, []);

  const toggleDay = useCallback(async (habitId, dateStr) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const current = logsByHabit[habitId] ? logsByHabit[habitId].has(dateStr) : false;

      if (current) {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .eq('log_date', dateStr);
        if (error) throw error;
        setLogsByHabit((prev) => {
          const next = { ...prev };
          if (next[habitId]) {
            next[habitId] = new Set(next[habitId]);
            next[habitId].delete(dateStr);
          }
          return next;
        });
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .insert([{ habit_id: habitId, user_id: user.id, log_date: dateStr }]);
        if (error) throw error;
        setLogsByHabit((prev) => {
          const next = { ...prev };
          next[habitId] = next[habitId] ? new Set(next[habitId]) : new Set();
          next[habitId].add(dateStr);
          return next;
        });
      }
    } catch (error) {
      console.error('Toggle habit log:', error);
      Alert.alert('Ошибка', error.message);
    }
  }, [logsByHabit]);

  const handleAddHabit = useCallback(async () => {
    const name = (newHabitName || '').trim();
    if (!name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('habits')
        .insert([{ user_id: user.id, name }]);

      if (error) throw error;
      setNewHabitName('');
      setModalVisible(false);
      onCloseAddHabitModal?.();
      await loadData();
    } catch (error) {
      console.error('Add habit:', error);
      Alert.alert('Ошибка', error.message);
    }
  }, [newHabitName, loadData, onCloseAddHabitModal]);

  const handleDeleteHabit = useCallback((habit) => {
    Alert.alert(
      'Удалить привычку?',
      `«${habit.name}»`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('habits').delete().eq('id', habit.id);
              if (error) throw error;
              await loadData();
            } catch (error) {
              Alert.alert('Ошибка', error.message);
            }
          },
        },
      ]
    );
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Привычки</Text>
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  const monthTitle = `${MONTH_NAMES[viewedMonth.month]} ${viewedMonth.year}`;
  const gridCells = buildMonthGrid(viewedMonth.year, viewedMonth.month);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Привычки</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.coralAccent]} />
        }
      >
        {habits.length === 0 ? (
          <View style={styles.emptyWrap}>
            <PersonStanding size={48} color={AppColors.inactive} strokeWidth={2} />
            <Text style={styles.emptyText}>Нет привычек</Text>
            <Text style={styles.emptySub}>Нажмите + чтобы добавить</Text>
          </View>
        ) : (
          habits.map((habit) => {
            const doneSet = logsByHabit[habit.id] || new Set();
            const doneCount = doneSet.size;
            return (
              <View key={habit.id} style={[styles.card, AppColors.cardShadow]}>
                <View style={styles.cardTitleRow}>
                  <PersonStanding size={22} color={AppColors.deepSea} strokeWidth={2} />
                  <Text style={styles.cardTitle} numberOfLines={1}>{habit.name}</Text>
                  <Text style={styles.habitCount}>{doneCount}</Text>
                  <TouchableOpacity
                    hitSlop={12}
                    onPress={() => handleDeleteHabit(habit)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Удалить</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.monthHeader}>
                  <TouchableOpacity onPress={goPrevMonth} style={styles.monthArrow} hitSlop={12}>
                    <ChevronLeft size={24} color={AppColors.deepSea} strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>{monthTitle}</Text>
                  <TouchableOpacity onPress={goNextMonth} style={styles.monthArrow} hitSlop={12}>
                    <ChevronRight size={24} color={AppColors.deepSea} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekdayRow}>
                  {WEEKDAY_LABELS.map((label) => (
                    <Text key={label} style={styles.weekdayLabel}>{label}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {gridCells.map((cell, index) => {
                    if (!cell) {
                      return <View key={`empty-${index}`} style={styles.calendarCell} />;
                    }
                    const done = doneSet.has(cell.dateStr);
                    return (
                      <TouchableOpacity
                        key={cell.dateStr}
                        style={styles.calendarCell}
                        onPress={() => toggleDay(habit.id, cell.dateStr)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.cellCircle, done ? styles.circleDone : styles.circleEmpty]}>
                          <Text style={styles.cellDayNumInside} numberOfLines={1}>{cell.dayNum}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setModalVisible(false); onCloseAddHabitModal?.(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Новая привычка</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: 10 минут зарядки"
              placeholderTextColor={AppColors.inactive}
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setModalVisible(false); onCloseAddHabitModal?.(); }}>
                <Text style={styles.modalBtnCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleAddHabit}>
                <Text style={styles.modalBtnSaveText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
    color: AppColors.textPrimary,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontFamily: 'Montserrat_400Regular',
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.textSecondary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: AppColors.inactive,
    marginTop: 4,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: AppColors.cardRadius,
    padding: 16,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.textPrimary,
  },
  habitCount: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.successGreen,
    marginRight: 4,
    minWidth: 20,
    textAlign: 'right',
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: AppColors.inactive,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthArrow: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: AppColors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    maxWidth: 48,
    maxHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  cellCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDayNumInside: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: 'rgba(45, 52, 54, 0.65)',
  },
  circleEmpty: {
    backgroundColor: 'transparent',
    borderColor: AppColors.chartInactiveBorder,
  },
  circleDone: {
    backgroundColor: AppColors.successGreen,
    borderColor: AppColors.successGreen,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: AppColors.white,
    borderRadius: AppColors.cardRadius,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.chartInactiveBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: AppColors.textPrimary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalBtnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: AppColors.textSecondary,
  },
  modalBtnSave: {
    backgroundColor: AppColors.coralAccent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalBtnSaveText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.white,
  },
});

export default HabitsScreen;
