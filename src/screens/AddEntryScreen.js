import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors } from '../styles/colors';
import { supabase } from '../services/supabase';

export const AddEntryScreen = ({ entry, onClose, onSaved }) => {
  const isEditing = entry !== undefined && entry !== null;
  const existingEntry = entry;

  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(
    existingEntry ? existingEntry.date : new Date().toISOString().split('T')[0]
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [tempDate, setTempDate] = useState(() => {
    if (existingEntry) {
      const [y, m, d] = existingEntry.date.split('-');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    return new Date();
  });
  const [weight, setWeight]       = useState(existingEntry ? String(existingEntry.weight) : '');
  const [waist, setWaist]         = useState(existingEntry ? String(existingEntry.waist  || '') : '');
  const [hips, setHips]           = useState(existingEntry ? String(existingEntry.hips   || '') : '');
  const [thigh, setThigh]         = useState(existingEntry ? String(existingEntry.thigh  || '') : '');
  const [neck, setNeck]           = useState(existingEntry ? String(existingEntry.neck   || '') : '');

  // === DATE PICKER HELPERS ===
  const showDatePicker = () => {
    const [y, m, d] = date.split('-');
    setTempDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
    setDatePickerVisible(true);
  };

  const confirmDatePicker = () => {
    const y = tempDate.getFullYear();
    const m = String(tempDate.getMonth() + 1).padStart(2, '0');
    const d = String(tempDate.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${d}`);
    setDatePickerVisible(false);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
      if (event.type === 'set' && selectedDate) {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        setDate(`${y}-${m}-${d}`);
      }
    } else {
      if (selectedDate) setTempDate(selectedDate);
    }
  };

  const formatDateDisplay = (ds) => {
    const [y, m, d] = ds.split('-');
    return `${d}.${m}.${y}`;
  };

  // === SAVE ===
  const handleSave = async () => {
    if (!weight || !date) { Alert.alert('Ошибка', 'Укажите дату и вес'); return; }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      Alert.alert('Ошибка', 'Проверьте введённый вес (от 0 до 500 кг)');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const entryData = {
        user_id: user.id, date, weight: weightNum,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        thigh: thigh ? parseFloat(thigh) : null,
        neck: neck ? parseFloat(neck) : null,
        timestamp: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase.from('entries').update(entryData).eq('id', existingEntry.id);
        if (error) throw error;
      } else {
        // Проверяем дубликат по дате
        const { data: existing } = await supabase
          .from('entries').select('id').eq('user_id', user.id).eq('date', date).single();

        if (existing) {
          Alert.alert('Запись уже существует', `На ${formatDateDisplay(date)} уже есть запись. Обновить?`, [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Обновить',
              onPress: async () => {
                try {
                  const { error } = await supabase.from('entries').update(entryData).eq('id', existing.id);
                  if (error) throw error;
                  onSaved ? onSaved() : onClose();
                } catch (e) { Alert.alert('Ошибка', e.message); }
              },
            },
          ]);
          setLoading(false);
          return;
        }

        const { error } = await supabase.from('entries').insert([entryData]);
        if (error) {
          if (error.code === '23505') { Alert.alert('Ошибка', 'Запись на эту дату уже существует.'); setLoading(false); return; }
          throw error;
        }
      }

      onSaved ? onSaved() : onClose();
    } catch (error) { Alert.alert('Ошибка', error.message); }
    finally { setLoading(false); }
  };

  // === DELETE ===
  const handleDelete = () => {
    Alert.alert('Удалить запись?', 'Это нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('entries').delete().eq('id', existingEntry.id);
            if (error) throw error;
            onSaved ? onSaved() : onClose();
          } catch (e) { Alert.alert('Ошибка', e.message); }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={true}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* === Header === */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Редактировать' : 'Новая запись'}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* === Основные === */}
        <View style={[styles.section, { backgroundColor: colors.pastelPink }]}>
          <Text style={styles.sectionTitle}>⚖️ Вес</Text>

          {/* Дата */}
          <Text style={styles.dateLabel}>Дата</Text>
          <TouchableOpacity style={styles.datePicker} onPress={showDatePicker}>
            <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* iOS Modal picker */}
          {Platform.OS === 'ios' && (
            <Modal visible={isDatePickerVisible} transparent animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                      <Text style={styles.modalBtn}>Отмена</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Выберите дату</Text>
                    <TouchableOpacity onPress={confirmDatePicker}>
                      <Text style={[styles.modalBtn, { color: colors.primary, fontFamily: 'Montserrat_600SemiBold' }]}>Готово</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate} mode="date" display="spinner"
                    onChange={handleDateChange} maximumDate={new Date()}
                    locale="ru-RU" textColor={colors.textPrimary}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Android picker */}
          {Platform.OS === 'android' && isDatePickerVisible && (
            <DateTimePicker value={new Date(date)} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
          )}

          <Input label="Вес (кг) *" value={weight} onChangeText={setWeight} placeholder="Например, 65.5" keyboardType="numeric" />
        </View>

        {/* === Дополнительные измерения === */}
        <View style={[styles.section, { backgroundColor: colors.pastelMint }]}>
          <Text style={styles.sectionTitle}>📏 Измерения</Text>
          <Text style={styles.sectionSub}>Для расчёта % жира (необязательно)</Text>
          <Input label="Обхват талии (см)" value={waist} onChangeText={setWaist} placeholder="Например, 75" keyboardType="numeric" />
          <Input label="Обхват бедер (см)" value={hips} onChangeText={setHips} placeholder="Например, 95" keyboardType="numeric" />
          <Input label="Обхват бедра (см)" value={thigh} onChangeText={setThigh} placeholder="Например, 55" keyboardType="numeric" />
          <Input label="Обхват шеи (см)" value={neck} onChangeText={setNeck} placeholder="Например, 32" keyboardType="numeric" />
        </View>

        {/* === Кнопки === */}
        <Button
          title={isEditing ? 'Сохранить изменения' : 'Добавить запись'}
          onPress={handleSave}
          loading={loading}
          disabled={!weight || !date || loading}
        />

        {isEditing && (
          <Button title="Удалить запись" onPress={handleDelete} variant="danger" style={styles.deleteBtn} />
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2ECF5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '700', fontFamily: 'Montserrat_700Bold', color: colors.textPrimary },

  // Section
  section: { borderRadius: 24, padding: 20, marginBottom: 14, shadowColor: '#D5CDE0', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Montserrat_700Bold', color: colors.textPrimary, marginBottom: 14 },
  sectionSub: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: colors.textSecondary, marginBottom: 14, marginTop: -8 },

  // Date picker row
  dateLabel: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: colors.textSecondary, marginBottom: 8 },
  datePicker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 18, borderWidth: 1.5, borderColor: '#EDE8F0', marginBottom: 16,
  },
  dateText: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: colors.textPrimary },

  // iOS modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EDE8F0' },
  modalTitle: { fontSize: 17, fontFamily: 'Montserrat_600SemiBold', color: colors.textPrimary },
  modalBtn: { fontSize: 16, fontFamily: 'Montserrat_500Medium', color: colors.textSecondary },

  deleteBtn: { marginTop: 14 },
});
