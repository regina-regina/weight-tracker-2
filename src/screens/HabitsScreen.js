import React, { useState, useEffect, useCallback } from 'react';
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
import { PersonStanding } from 'lucide-react-native';
import { AppColors } from '../styles/colors';
import { supabase } from '../services/supabase';

const DAYS_IN_GRID = 28;
const COLS = 7;

function getDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDates() {
  const out = [];
  const d = new Date();
  for (let i = DAYS_IN_GRID - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(x.getDate() - i);
    out.push(getDateStr(x));
  }
  return out;
}

const GRID_DATES = buildDates();

export const HabitsScreen = ({ openAddHabitModal, onCloseAddHabitModal }) => {
  const [habits, setHabits] = useState([]);
  const [logsByHabit, setLogsByHabit] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    if (openAddHabitModal) {
      setModalVisible(true);
      onCloseAddHabitModal?.();
    }
  }, [openAddHabitModal, onCloseAddHabitModal]);

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

      const startDate = GRID_DATES[0];
      const endDate = GRID_DATES[GRID_DATES.length - 1];

      const { data: logs, error: logsErr } = await supabase
        .from('habit_logs')
        .select('habit_id, log_date')
        .eq('user_id', user.id)
        .gte('log_date', startDate)
        .lte('log_date', endDate);

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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
            return (
              <View key={habit.id} style={[styles.card, AppColors.cardShadow]}>
                <View style={styles.cardTitleRow}>
                  <PersonStanding size={22} color={AppColors.deepSea} strokeWidth={2} />
                  <Text style={styles.cardTitle} numberOfLines={1}>{habit.name}</Text>
                  <TouchableOpacity
                    hitSlop={12}
                    onPress={() => handleDeleteHabit(habit)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteBtnText}>Удалить</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.grid}>
                  {GRID_DATES.map((dateStr) => {
                    const done = doneSet.has(dateStr);
                    return (
                      <TouchableOpacity
                        key={dateStr}
                        style={[styles.circle, done ? styles.circleDone : styles.circleEmpty]}
                        onPress={() => toggleDay(habit.id, dateStr)}
                        activeOpacity={0.7}
                      />
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
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: AppColors.inactive,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
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
