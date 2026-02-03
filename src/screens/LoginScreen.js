import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { colors } from '../styles/colors';
import { supabase } from '../services/supabase';

export const LoginScreen = ({ onLoginSuccess, onSignUpPress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните email и пароль');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      onLoginSuccess(!!userData);
    } catch (error) {
      console.log('Ошибка входа:', error);
      Alert.alert('Ошибка входа', error.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Введите email', 'Укажите email для восстановления пароля');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      Alert.alert('Письмо отправлено', 'Проверьте email для восстановления пароля');
    } catch (error) {
      Alert.alert('Ошибка', error.message);
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
      {/* Розовый hero сверху */}
      <View style={styles.heroBlock}>
        <Text style={styles.heroIllustration}>🧘‍♀️</Text>
        <Text style={styles.heroTitle}>Добро пожаловать</Text>
        <Text style={styles.heroSubtitle}>к вашему личному трекеру</Text>
      </View>

      {/* Белая форма снизу с закруглёнными верхними углами */}
      <View style={styles.formSheet}>
        <View style={styles.formSheetHandle} />

        <Text style={styles.formTitle}>Войти в аккаунт</Text>

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

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
          <Text style={styles.forgotText}>Забыли пароль?</Text>
        </TouchableOpacity>

        <Button
          title="Войти"
          onPress={handleLogin}
          loading={loading}
          disabled={!email || !password}
          style={styles.loginButton}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Еще нет аккаунта? </Text>
          <TouchableOpacity onPress={onSignUpPress}>
            <Text style={styles.signupLink}>Зарегистрироваться</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero розовый блок
  heroBlock: {
    backgroundColor: colors.background,
    paddingTop: 72,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroIllustration: {
    fontSize: 72,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
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

  // Белый sheet снизу
  formSheet: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
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

  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: colors.accent,
  },
  loginButton: {
    marginBottom: 20,
  },

  // Divider "или"
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0EBF2',
  },
  dividerText: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: colors.textLight,
    paddingHorizontal: 12,
  },

  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.accent,
  },
});
