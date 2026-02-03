import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { supabase } from '../services/supabase';

// Мягкие цвета карточек — как плитки в рефах
const cardColors = [
  colors.pastelPink,
  colors.pastelMint,
  colors.pastelLavender,
  colors.pastelPeach,
  colors.pastelBlue,
  colors.pastelYellow,
];

export const HistoryScreen = ({ onEditEntry, onAddEntry }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('entries').select('*').eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, []);

  const handleDelete = (entry) => {
    Alert.alert('Удалить запись?', `Запись от ${formatDate(entry.date)}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('entries').delete().eq('id', entry.id);
            if (error) throw error;
            loadEntries();
          } catch (error) { Alert.alert('Ошибка', error.message); }
        },
      },
    ]);
  };

  // Парсим дату без UTC-сдвига
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const formatYear = (dateString) => {
    const [year] = dateString.split('-');
    return year;
  };

  // Разница с предыдущей записью
  const getWeightDiff = (index) => {
    if (index >= entries.length - 1) return null;
    return entries[index].weight - entries[index + 1].weight;
  };

  const renderEntry = ({ item, index }) => {
    const diff = getWeightDiff(index);
    const cardBg = cardColors[index % cardColors.length];

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg }]}
        onPress={() => onEditEntry(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.88}
      >
        <View style={styles.cardRow}>
          {/* Левая часть: дата + измерения */}
          <View style={styles.cardLeft}>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            <Text style={styles.cardYear}>{formatYear(item.date)}</Text>
            {(item.waist || item.hips || item.neck) && (
              <Text style={styles.cardMeasurements}>
                {[item.waist && `Т ${item.waist}`, item.hips && `Б ${item.hips}`, item.neck && `Ш ${item.neck}`].filter(Boolean).join(' · ')} см
              </Text>
            )}
          </View>

          {/* Правая часть: вес + diff */}
          <View style={styles.cardRight}>
            <Text style={styles.cardWeight}>{item.weight.toFixed(1)}<Text style={styles.cardWeightUnit}> кг</Text></Text>
            {diff !== null && (
              <View style={styles.diffBadge}>
                <Ionicons
                  name={diff < 0 ? 'arrow-down' : diff > 0 ? 'arrow-up' : 'remove'}
                  size={14}
                  color={diff < 0 ? colors.success : diff > 0 ? '#E53935' : colors.textSecondary}
                />
                <Text style={[styles.diffText, diff < 0 && styles.diffDown, diff > 0 && styles.diffUp]}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // === LOADING ===
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skelWrap}>
          {[1,2,3,4].map(i => <View key={i} style={styles.skelCard} />)}
        </View>
      </View>
    );
  }

  // === EMPTY ===
  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Пока пусто</Text>
          <Text style={styles.emptySub}>Нажмите + наверху, чтобы добавить первую запись</Text>
        </View>
      </View>
    );
  }

  // === LIST ===
  return (
    <View style={styles.container}>
      {/* Подзаголовок кол-во записей */}
      <Text style={styles.countText}>
        {entries.length} {entries.length === 1 ? 'запись' : entries.length < 5 ? 'записи' : 'записей'}
      </Text>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Skeleton
  skelWrap: { padding: 20 },
  skelCard: { height: 86, borderRadius: 20, backgroundColor: '#EDE8F0', marginBottom: 12 },

  // Empty
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary, textAlign: 'center' },

  // Count
  countText: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
  },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 90 },

  // Card
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#D5CDE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  cardLeft: {},
  cardDate: { fontSize: 16, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.textPrimary, marginBottom: 2 },
  cardYear: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary, marginBottom: 3 },
  cardMeasurements: { fontSize: 11, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary },

  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardWeight: { fontSize: 22, fontWeight: '700', fontFamily: 'Montserrat_700Bold', color: colors.textPrimary },
  cardWeightUnit: { fontSize: 14, fontFamily: 'Montserrat_500Medium', color: colors.textSecondary, fontWeight: '500' },

  // Diff badge
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  diffText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: colors.textSecondary },
  diffDown: { color: colors.success },
  diffUp: { color: '#E53935' },
});
