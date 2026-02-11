import React, { useState, useEffect } from 'react';
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
import { AppIcon } from '../components/AppIcon';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
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
      // ИСПРАВЛЕНО: Парсим дату корректно
      const [year, month, day] = existingEntry.date.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date();
  });
  const [weight, setWeight] = useState(existingEntry ? String(existingEntry.weight) : '');
  const [waist, setWaist] = useState(existingEntry ? String(existingEntry.waist || '') : '');
  const [hips, setHips] = useState(existingEntry ? String(existingEntry.hips || '') : '');
  const [thigh, setThigh] = useState(existingEntry ? String(existingEntry.thigh || '') : '');
  const [neck, setNeck] = useState(existingEntry ? String(existingEntry.neck || '') : '');

  const showDatePicker = () => {
    // ИСПРАВЛЕНО: Правильно парсим дату из строки YYYY-MM-DD
    const [year, month, day] = date.split('-');
    setTempDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const confirmDatePicker = () => {
    // ИСПРАВЛЕНО: Форматируем дату из локальных компонентов, а не через UTC
    const year = tempDate.getFullYear();
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const day = String(tempDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    setDate(formattedDate);
    setDatePickerVisible(false);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setDatePickerVisible(false);
      if (event.type === 'set' && selectedDate) {
        // ИСПРАВЛЕНО: Форматируем дату из локальных компонентов
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setDate(formattedDate);
      }
    } else {
      // iOS - только обновляем временную дату
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const formatDateDisplay = (dateString) => {
    // ИСПРАВЛЕНО: Парсим дату как локальную, а не UTC
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  };

  const isSaveDisabled = !weight || !date || loading;

  const handleSave = async () => {
    if (!weight || !date) {
      Alert.alert('Ошибка', 'Укажите дату и вес');
      return;
    }

    // Валидация значений
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      Alert.alert('Ошибка', 'Проверьте введенный вес (должен быть от 0 до 500 кг)');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const entryData = {
        user_id: user.id,
        date,
        weight: weightNum,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        thigh: thigh ? parseFloat(thigh) : null,
        neck: neck ? parseFloat(neck) : null,
        timestamp: new Date().toISOString(),
      };

      if (isEditing) {
        // Обновление существующей записи
        const { error } = await supabase
          .from('entries')
          .update(entryData)
          .eq('id', existingEntry.id);

        if (error) throw error;
        onSaved ? onSaved() : onClose();
        setLoading(false);
        return;
      } else {
        // Создание новой записи - проверяем дубликаты
        const { data: existingData } = await supabase
          .from('entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', date)
          .single();

        if (existingData) {
          // Запись на эту дату уже существует - предлагаем обновить
          Alert.alert(
            'Запись уже существует',
            `На дату ${formatDateDisplay(date)} уже есть запись. Обновить ее?`,
            [
              { text: 'Отмена', style: 'cancel' },
              {
                text: 'Обновить',
                onPress: async () => {
                  try {
                    const { error } = await supabase
                      .from('entries')
                      .update(entryData)
                      .eq('id', existingData.id);

                    if (error) throw error;
                    onSaved ? onSaved() : onClose();
                  } catch (error) {
                    Alert.alert('Ошибка', error.message);
                  }
                },
              },
            ]
          );
          setLoading(false);
          return;
        }

        const { error } = await supabase.from('entries').insert([entryData]);

        if (error) {
          // Обработка ошибки уникальности на уровне БД
          if (error.code === '23505') {
            Alert.alert('Ошибка', 'Запись на эту дату уже существует. Попробуйте выбрать другую дату.');
            setLoading(false);
            return;
          }
          throw error;
        }
      }

      onSaved ? onSaved() : onClose();
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Удалить запись?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('entries')
                .delete()
                .eq('id', existingEntry.id);

              if (error) throw error;
              onClose();
            } catch (error) {
              Alert.alert('Ошибка', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={true}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Редактировать запись' : 'Добавить запись'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AppIcon name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Card color={colors.pastelPink}>
          <Text style={styles.cardTitle}>Основные измерения</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Дата</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateInputRow}>
                {React.createElement('input', {
                  type: 'date',
                  value: date,
                  max: new Date().toISOString().split('T')[0],
                  onChange: (e) => setDate(e.target.value),
                  style: {
                    flex: 1,
                    fontSize: 16,
                    padding: 14,
                    marginRight: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#F0F4F8',
                    fontFamily: 'Montserrat_500Medium',
                  },
                })}
                <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.dateInput} onPress={showDatePicker}>
                <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
                <AppIcon name="calendar-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {Platform.OS === 'web' ? null : Platform.OS === 'ios' ? (
            <Modal
              visible={isDatePickerVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={hideDatePicker}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={hideDatePicker}>
                      <Text style={styles.modalButton}>Отмена</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmDatePicker}>
                      <Text style={[styles.modalButton, styles.modalButtonPrimary]}>Готово</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    locale="ru-RU"
                    textColor={colors.textPrimary}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            isDatePickerVisible && (
              <DateTimePicker
                value={new Date(date)}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )
          )}

          <Input
            label="Вес (кг) *"
            value={weight}
            onChangeText={setWeight}
            placeholder="Например, 65.5"
            keyboardType="numeric"
          />
        </Card>

        <Card color={colors.pastelMint}>
          <Text style={styles.cardTitle}>Дополнительные измерения</Text>
          <Text style={styles.subtitle}>
            Для более точного расчета процента жира
          </Text>

          <Input
            label="Обхват талии (см)"
            value={waist}
            onChangeText={setWaist}
            placeholder="Например, 75"
            keyboardType="numeric"
          />

          <Input
            label="Обхват бедер (см)"
            value={hips}
            onChangeText={setHips}
            placeholder="Например, 95"
            keyboardType="numeric"
          />

          <Input
            label="Обхват бедра (см)"
            value={thigh}
            onChangeText={setThigh}
            placeholder="Например, 55"
            keyboardType="numeric"
          />

          <Input
            label="Обхват шеи (см)"
            value={neck}
            onChangeText={setNeck}
            placeholder="Например, 32"
            keyboardType="numeric"
          />
        </Card>

        <Button
          title={isEditing ? 'Сохранить изменения' : 'Добавить запись'}
          onPress={handleSave}
          loading={loading}
          disabled={isSaveDisabled}
          style={isSaveDisabled ? styles.buttonDisabled : null}
        />

        {isEditing && (
          <Button
            title="Удалить запись"
            onPress={handleDelete}
            style={styles.deleteButton}
          />
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F0F4F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textPrimary,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F0F4F8',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabBarBorder,
  },
  modalButton: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
  },
  modalButtonPrimary: {
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.primary,
  },
  deleteButton: {
    marginTop: 16,
    backgroundColor: '#FF8B94',
  },
  buttonDisabled: {
    opacity: 0.4,
    backgroundColor: '#D0D7DE',
  },
  bottomSpacing: {
    height: 100,
  },
});
