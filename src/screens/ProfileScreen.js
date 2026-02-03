import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors } from '../styles/colors';
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

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (error) throw error;
      setUserData(data);
      setGender(data.gender);
      setAge(String(data.age));
      setHeight(String(data.height));
      setGoalWeight(String(data.goal_weight));
      setActivityLevel(data.activity_level);
      setPace(data.pace);
    } catch (error) { Alert.alert('Ошибка', error.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!age || !height || !goalWeight) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');
      const { error } = await supabase.from('users').update({
        gender, age: parseInt(age), height: parseFloat(height),
        goal_weight: parseFloat(goalWeight), activity_level: activityLevel, pace,
      }).eq('id', user.id);
      if (error) throw error;
      Alert.alert('Успешно', 'Профиль обновлён');
      loadProfile();
    } catch (error) { Alert.alert('Ошибка', error.message); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    Alert.alert('Выход из аккаунта', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          try { await supabase.auth.signOut(); }
          catch (e) { Alert.alert('Ошибка', e.message); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skelWrap}>
          <View style={styles.skelAvatar} />
          <View style={styles.skelCard} />
          <View style={styles.skelCard} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* === Аватар блок === */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{userData?.gender === 'male' ? '👨' : '👩'}</Text>
          </View>
          <Text style={styles.avatarEmail}>{userData?.email || 'email'}</Text>
        </View>

        {/* === Основные данные === */}
        <View style={[styles.section, { backgroundColor: colors.pastelPink }]}>
          <Text style={styles.sectionTitle}>👤 Основные данные</Text>

          <Text style={styles.sectionLabel}>Пол</Text>
          <View style={styles.genderRow}>
            {genders.map(g => {
              const sel = gender === g.value;
              return (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.genderPill, sel && styles.genderPillActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.genderText, sel && styles.genderTextActive]}>
                    {g.value === 'male' ? '♂️' : '♀️'}  {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input label="Возраст (лет)" value={age} onChangeText={setAge} keyboardType="numeric" />
          <Input label="Рост (см)" value={height} onChangeText={setHeight} keyboardType="numeric" />
        </View>

        {/* === Цели === */}
        <View style={[styles.section, { backgroundColor: colors.pastelMint }]}>
          <Text style={styles.sectionTitle}>🎯 Цели</Text>
          <Input label="Целевой вес (кг)" value={goalWeight} onChangeText={setGoalWeight} keyboardType="numeric" />
        </View>

        {/* === Активность === */}
        <View style={[styles.section, { backgroundColor: colors.pastelLavender }]}>
          <Text style={styles.sectionTitle}>🏃 Активность</Text>
          {activityLevels.map(level => {
            const sel = activityLevel === level.value;
            return (
              <TouchableOpacity
                key={level.value}
                style={[styles.optionCard, sel && styles.optionCardActive]}
                onPress={() => setActivityLevel(level.value)}
              >
                <View style={styles.optionInner}>
                  <View>
                    <Text style={[styles.optionTitle, sel && styles.optionTitleActive]}>{level.label}</Text>
                    <Text style={styles.optionDesc}>{level.description}</Text>
                  </View>
                  {sel && (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkIcon}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* === Темп === */}
        <View style={[styles.section, { backgroundColor: colors.pastelPeach }]}>
          <Text style={styles.sectionTitle}>⚡ Темп похудения</Text>
          {paces.map(p => {
            const sel = pace === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                style={[styles.optionCard, sel && styles.optionCardActive]}
                onPress={() => setPace(p.value)}
              >
                <View style={styles.optionInner}>
                  <View>
                    <Text style={[styles.optionTitle, sel && styles.optionTitleActive]}>{p.label}</Text>
                    <Text style={styles.optionDesc}>{p.description}</Text>
                  </View>
                  <View style={[styles.paceBadge, { backgroundColor: p.color }]}>
                    <Text style={styles.paceBadgeText}>{p.value === 'fast' ? '🔥' : p.value === 'optimal' ? '⚡' : '🌱'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* === Сохранить === */}
        <Button title="Сохранить изменения" onPress={handleSave} loading={saving} style={styles.saveBtn} />

        {/* === Выход — отдельная опасная секция === */}
        <View style={styles.dangerSection}>
          <View style={styles.dangerDivider} />
          <Button title="Выйти из аккаунта" onPress={handleLogout} variant="danger" />
        </View>

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
  skelWrap: { padding: 20, paddingTop: 20 },
  skelAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EDE8F0', alignSelf: 'center', marginBottom: 16 },
  skelCard: { height: 140, borderRadius: 24, backgroundColor: '#EDE8F0', marginBottom: 14 },

  // Avatar
  avatarBlock: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.pastelPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#E8C0D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarEmoji: { fontSize: 38 },
  avatarEmail: { fontSize: 14, fontFamily: 'Montserrat_500Medium', color: colors.textSecondary },

  // Section (карточка с цветом)
  section: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#D5CDE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Montserrat_700Bold', color: colors.textPrimary, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Gender pills
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  genderPill: { flex: 1, paddingVertical: 13, borderRadius: 18, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EDE8F0' },
  genderPillActive: { backgroundColor: colors.primary, borderColor: colors.primary, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  genderText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: colors.textPrimary },
  genderTextActive: { color: '#FFFFFF' },

  // Option cards
  optionCard: { backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 10, borderWidth: 1.5, borderColor: '#EDE8F0' },
  optionCardActive: { borderColor: colors.primary, backgroundColor: '#FFF5F3' },
  optionInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  optionTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Montserrat_700Bold', color: colors.textPrimary, marginBottom: 2 },
  optionTitleActive: { color: colors.primary },
  optionDesc: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkIcon: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  paceBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  paceBadgeText: { fontSize: 17 },

  // Save
  saveBtn: { marginTop: 4 },

  // Danger (logout)
  dangerSection: { marginTop: 12 },
  dangerDivider: { height: 1, backgroundColor: '#EDE8F0', marginBottom: 14 },
});
