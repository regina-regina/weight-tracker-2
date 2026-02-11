import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors } from '../styles/colors';
import { supabase } from '../services/supabase';
import { getAuthErrorMessage } from '../utils/authMessages';

export const SignUpScreen = ({ onSignUpSuccess, onLoginPress }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      if (error) throw error;
      if (data.user) {
        Alert.alert(
          'Регистрация успешна!',
          'Теперь заполните информацию о себе',
          [{ text: 'Продолжить', onPress: () => onSignUpSuccess(name.trim()) }]
        );
      }
    } catch (error) {
      console.log('Ошибка регистрации:', error);
      Alert.alert('Ошибка регистрации', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={true}
    >
      {/* Розовый hero */}
      <View style={styles.heroBlock}>
        <Text style={styles.heroIllustration}>🌱</Text>
        <Text style={styles.heroTitle}>Новый старт</Text>
        <Text style={styles.heroSubtitle}>начнём путь к цели вместе</Text>
      </View>

      {/* Белый sheet */}
      <ScrollView
        style={styles.formSheet}
        contentContainerStyle={styles.formSheetContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSheetHandle} />

        <Text style={styles.formTitle}>Создать аккаунт</Text>

        <Input
          label="Имя"
          value={name}
          onChangeText={setName}
          placeholder="Как к вам обращаться?"
          autoCapitalize="words"
        />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="example@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Input
          label="Пароль"
          value={password}
          onChangeText={setPassword}
          placeholder="Минимум 6 символов"
          secureTextEntry
          autoCapitalize="none"
        />

        <Input
          label="Повторите пароль"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Повторите пароль"
          secureTextEntry
          autoCapitalize="none"
        />

        <Button
          title="Зарегистрироваться"
          onPress={handleSignUp}
          loading={loading}
          disabled={!email || !password || !confirmPassword || loading}
          style={styles.signupButton}
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Уже есть аккаунт? </Text>
          <TouchableOpacity onPress={onLoginPress}>
            <Text style={styles.loginLink}>Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero
  heroBlock: {
    backgroundColor: colors.background,
    paddingTop: 64,
    paddingBottom: 36,
    alignItems: 'center',
  },
  heroIllustration: {
    fontSize: 64,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
  },

  // Sheet
  formSheet: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  formSheetContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  formSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E8E2EE',
    alignSelf: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    marginBottom: 24,
  },

  signupButton: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.accent,
  },
});
