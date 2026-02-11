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
import { AppIcon } from '../components/AppIcon';
import { colors } from '../styles/colors';
import { supabase } from '../services/supabase';

// Чередование цветов карточек
const cardColors = [
  colors.pastelBlue,
  colors.pastelMint,
  colors.pastelLavender,
  colors.pastelPeach,
  colors.pastelPink,
];

export const HistoryScreen = ({ onEditEntry }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, []);

  const handleDelete = (entry) => {
    Alert.alert(
      'Удалить запись?',
      `Запись от ${formatDate(entry.date)}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('entries').delete().eq('id', entry.id);
              if (error) throw error;
              loadEntries();
            } catch (error) {
              Alert.alert('Ошибка', error.message);
            }
          },
        },
      ]
    );
  };

  // ИСПРАВЛЕНО: парсим дату как локальную через split, а не через new Date(string) с UTC сдвигом
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Разница веса с предыдущей записью
  const getWeightDiff = (index) => {
    if (index >= entries.length - 1) return null;
    const current = entries[index].weight;
    const prev = entries[index + 1].weight; // entries отсортированы desc, значит index+1 = раньше
    return current - prev;
  };

  const renderEntry = ({ item, index }) => {
    const diff = getWeightDiff(index);
    const cardColor = cardColors[index % cardColors.length];

    return (
      <TouchableOpacity
        style={[styles.entryCard, { backgroundColor: cardColor }]}
        onPress={() => onEditEntry(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.entryHeader}>
          <View>
            <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
            {(item.waist || item.hips || item.thigh || item.neck) && (
              <Text style={styles.entryMeasurements}>
                {[
                  item.waist && `Т: ${item.waist}`,
                  item.hips && `Б: ${item.hips}`,
                  item.neck && `Ш: ${item.neck}`,
                ].filter(Boolean).join(' · ')} см
              </Text>
            )}
          </View>

          <View style={styles.entryRightSide}>
            <Text style={styles.entryWeight}>{item.weight.toFixed(1)} кг</Text>
            {diff !== null && (
              <View style={styles.diffContainer}>
                <AppIcon
                  name={diff < 0 ? 'arrow-down' : diff > 0 ? 'arrow-up' : 'remove'}
                  size={16}
                  color={diff < 0 ? '#4CAF50' : diff > 0 ? '#FF5252' : colors.textSecondary}
                />
                <Text style={[styles.diffText, diff < 0 ? styles.diffDown : diff > 0 ? styles.diffUp : styles.diffZero]}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>История</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>Пока нет записей</Text>
          <Text style={styles.emptySubtext}>
            Нажмите кнопку + чтобы добавить первую запись
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>История</Text>
        <Text style={styles.headerSubtitle}>{entries.length} {entries.length === 1 ? 'запись' : entries.length < 5 ? 'записи' : 'записей'}</Text>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
  },

  // Skeleton
  skeletonContainer: {
    padding: 20,
  },
  skeletonCard: {
    height: 90,
    borderRadius: 24,
    backgroundColor: '#EEF1F4',
    marginBottom: 12,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // List
  listContent: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 100,
  },

  // Entry card
  entryCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  entryMeasurements: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
  },
  entryRightSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  entryWeight: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
  },

  // Weight diff indicator
  diffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  diffText: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
  },
  diffDown: {
    color: '#4CAF50',
  },
  diffUp: {
    color: '#FF5252',
  },
  diffZero: {
    color: colors.textSecondary,
  },
});
