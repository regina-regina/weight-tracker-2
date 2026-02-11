import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { MainScreen } from './src/screens/MainScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { supabase } from './src/services/supabase';
import { hasActiveSubscription } from './src/services/subscription';

export default function App() {
  // 0 = login, 1 = signup, 2 = onboarding, 3 = subscription, 4 = main
  const [screen, setScreen] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [pendingUserName, setPendingUserName] = useState(null);

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

  // При выходе из аккаунта сразу показываем экран входа
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setScreen(0);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const goToMainOrSubscription = async () => {
    const hasAccess = await hasActiveSubscription();
    setScreen(hasAccess ? 4 : 3);
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Проверка сессии:', session ? 'Найдена' : 'Не найдена');
      
      if (sessionError) {
        console.log('Ошибка сессии:', sessionError);
      }
      
      if (session) {
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
          await goToMainOrSubscription();
        } else if (userError && userError.code === 'PGRST116') {
          setScreen(2);
        } else {
          await goToMainOrSubscription();
        }
      } else {
        setScreen(0);
      }
    } catch (error) {
      console.log('Ошибка проверки сессии:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleLoginSuccess = (hasUserData) => {
    if (hasUserData) {
      goToMainOrSubscription();
    } else {
      setScreen(2);
    }
  };

  const handleSignUpSuccess = (name) => {
    setPendingUserName(name || null);
    setScreen(2);
  };

  const handleOnboardingComplete = () => {
    setPendingUserName(null);
    goToMainOrSubscription();
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
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {screen === 4 ? (
          <MainScreen />
        ) : screen === 3 ? (
          <SubscriptionScreen onSuccess={() => setScreen(4)} />
        ) : screen === 2 ? (
          <OnboardingScreen initialName={pendingUserName} onComplete={handleOnboardingComplete} />
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
    </ErrorBoundary>
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

