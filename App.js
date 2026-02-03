import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { MainScreen } from './src/screens/MainScreen';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { supabase } from './src/services/supabase';

export default function App() {
  // 0 = login, 1 = signup, 2 = onboarding, 3 = main
  const [screen, setScreen] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Проверяем существующую сессию при запуске
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Проверка сессии:', session ? 'Найдена' : 'Не найдена');
      
      if (sessionError) {
        console.log('Ошибка сессии:', sessionError);
      }
      
      if (session) {
        // Проверяем, есть ли данные пользователя
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        console.log('Данные пользователя:', userData ? 'Найдены' : 'Не найдены');
        
        if (userError && userError.code !== 'PGRST116') {
          console.log('Ошибка загрузки пользователя:', userError);
        }
        
        if (userData) {
          setScreen(3); // Главный экран
        } else {
          setScreen(2); // Онбординг для существующего пользователя без данных
        }
      } else {
        setScreen(0); // Экран входа
      }
    } catch (error) {
      console.log('Ошибка проверки сессии:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleLoginSuccess = (hasUserData) => {
    if (hasUserData) {
      setScreen(3); // Главный экран
    } else {
      setScreen(2); // Онбординг
    }
  };

  const handleSignUpSuccess = () => {
    setScreen(2); // Онбординг после регистрации
  };

  const handleOnboardingComplete = () => {
    setScreen(3); // Главный экран
  };

  const handleGoToSignUp = () => {
    setScreen(1);
  };

  const handleGoToLogin = () => {
    setScreen(0);
  };

  if (!fontsLoaded || isCheckingSession) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {screen === 3 ? (
        <MainScreen />
      ) : screen === 2 ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : screen === 1 ? (
        <SignUpScreen 
          onSignUpSuccess={handleSignUpSuccess}
          onLoginPress={handleGoToLogin}
        />
      ) : (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onSignUpPress={handleGoToSignUp}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7D8A',
  },
});

