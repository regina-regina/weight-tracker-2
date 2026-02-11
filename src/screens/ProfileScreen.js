import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppColors } from '../styles/colors';
import { supabase } from '../services/supabase';
import { activityLevels, paces, genders } from '../utils/constants';

export const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);

  const [gender, setGender] = useState('female');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [pace, setPace] = useState('optimal');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUserData(data);
      setGender(data.gender);
      setAge(String(data.age));
      setHeight(String(data.height));
      setGoalWeight(String(data.goal_weight));
      setActivityLevel(data.activity_level);
      setPace(data.pace);
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!age || !height || !goalWeight) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { error } = await supabase
        .from('users')
        .update({
          gender,
          age: parseInt(age),
          height: parseFloat(height),
          goal_weight: parseFloat(goalWeight),
          activity_level: activityLevel,
          pace,
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Успешно', 'Профиль обновлен');
      loadProfile();
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Выход из аккаунта',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (error) {
              Alert.alert('Ошибка', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Профиль</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Аватар / email блок */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userData?.gender === 'male' ? '👨' : '👩'}
            </Text>
          </View>
          <Text style={styles.avatarEmail}>{userData?.email || 'email'}</Text>
        </View>

        {/* Основные данные */}
        <Card color={AppColors.softBlush}>
          <Text style={styles.cardTitle}>👤 Основные данные</Text>

          <Text style={styles.label}>Пол</Text>
          <View style={styles.optionsRow}>
            {genders.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.option, gender === g.value && styles.optionSelected]}
                onPress={() => setGender(g.value)}
              >
                <Text style={[styles.optionText, gender === g.value && styles.optionTextSelected]}>
                  {g.value === 'male' ? '♂️ ' : '♀️ '}{g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Возраст (лет)" value={age} onChangeText={setAge} keyboardType="numeric" />
          <Input label="Рост (см)" value={height} onChangeText={setHeight} keyboardType="numeric" />
        </Card>

        {/* Цели */}
        <Card color={AppColors.sageMintLight}>
          <Text style={styles.cardTitle}>🎯 Цели</Text>
          <Input label="Целевой вес (кг)" value={goalWeight} onChangeText={setGoalWeight} keyboardType="numeric" />
        </Card>

        {/* Активность */}
        <Card color={AppColors.beigeWarm}>
          <Text style={styles.cardTitle}>🏃 Уровень активности</Text>
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[styles.listOption, activityLevel === level.value && styles.listOptionSelected]}
              onPress={() => setActivityLevel(level.value)}
            >
              <View style={styles.listOptionInner}>
                <View>
                  <Text style={styles.listOptionTitle}>{level.label}</Text>
                  <Text style={styles.listOptionDescription}>{level.description}</Text>
                </View>
                {activityLevel === level.value && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Темп */}
        <Card color={AppColors.peachyLight}>
          <Text style={styles.cardTitle}>⚡ Темп похудения</Text>
          {paces.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.listOption, pace === p.value && styles.listOptionSelected]}
              onPress={() => setPace(p.value)}
            >
              <View style={styles.listOptionInner}>
                <View>
                  <Text style={styles.listOptionTitle}>{p.label}</Text>
                  <Text style={styles.listOptionDescription}>{p.description}</Text>
                </View>
                <View style={[styles.paceDot, { backgroundColor: p.color }]} />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Сохранить */}
        <Button title="Сохранить изменения" onPress={handleSave} loading={saving} />

        {/* Кнопка выхода — отдельный блок внизу */}
        <View style={styles.logoutSection}>
          <View style={styles.logoutDivider} />
          <Button title="Выйти из аккаунта" onPress={handleLogout} variant="danger" />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.screenBackground,
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: AppColors.screenBackground,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: AppColors.deepSea,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },

  // Skeleton
  skeletonContainer: {
    padding: 20,
    paddingTop: 80,
  },
  skeletonCard: {
    height: 160,
    borderRadius: 28,
    backgroundColor: '#EEF1F4',
    marginBottom: 16,
  },

  // Avatar block
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.softBlush,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...AppColors.cardShadow,
  },
  avatarText: {
    fontSize: 36,
  },
  avatarEmail: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#95A5A6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.deepSea,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.profileFieldLabel,
    marginBottom: 12,
  },

  // Gender options
  optionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  option: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: AppColors.coralAccent,
    backgroundColor: AppColors.coralAccent,
    ...AppColors.cardShadow,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    color: AppColors.profileFieldLabel,
  },
  optionTextSelected: {
    color: AppColors.white,
  },
  listOption: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  listOptionSelected: {
    borderColor: AppColors.coralAccent,
    backgroundColor: AppColors.profilePaceActiveBg,
    ...AppColors.cardShadow,
  },
  listOptionInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  listOptionDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: AppColors.bmrStripSub,
  },
  checkmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.coralAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  paceDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  logoutSection: {
    marginTop: 8,
  },
  logoutDivider: {
    height: 1,
    backgroundColor: AppColors.navTopBorder,
    marginBottom: 16,
  },

  bottomSpacing: {
    height: 100,
  },
});
