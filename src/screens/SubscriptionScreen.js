import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../components/Button';
import { colors } from '../styles/colors';
import {
  getSubscriptionProducts,
  requestSubscriptionPurchase,
  restoreSubscriptionPurchases,
  isIAPAvailable,
  setCachedSubscription,
} from '../services/subscription';
import { SUBSCRIPTION_PRODUCT_IDS, SUBSCRIPTION_PRICES } from '../utils/subscriptionConstants';

export const SubscriptionScreen = ({ onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [iapReady, setIapReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await isIAPAvailable();
      if (!mounted) return;
      setIapReady(ok);
      if (ok) {
        const list = await getSubscriptionProducts();
        if (mounted) setProducts(list);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const getPrice = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (p?.localizedPrice) return p.localizedPrice;
    if (productId === SUBSCRIPTION_PRODUCT_IDS.MONTHLY) return `${SUBSCRIPTION_PRICES.MONTHLY} ₽`;
    if (productId === SUBSCRIPTION_PRODUCT_IDS.YEARLY) return `${SUBSCRIPTION_PRICES.YEARLY} ₽`;
    return '';
  };

  const handlePurchase = (productId) => {
    setPurchasingId(productId);
    requestSubscriptionPurchase(productId, {
      onSuccess: () => {
        setPurchasingId(null);
        onSuccess?.();
      },
      onError: (err) => {
        setPurchasingId(null);
        Alert.alert('Ошибка', err?.message || 'Не удалось оформить подписку');
      },
    });
  };

  const handleRestore = async () => {
    setRestoring(true);
    const hasAccess = await restoreSubscriptionPurchases();
    setRestoring(false);
    if (hasAccess) {
      onSuccess?.();
    } else {
      Alert.alert('Восстановление', 'Активная подписка не найдена.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroBlock}>
        <Text style={styles.heroEmoji}>✨</Text>
        <Text style={styles.heroTitle}>Подписка Weight Tracker</Text>
        <Text style={styles.heroSubtitle}>
          3 дня бесплатно, затем подписка. Отмена в любой момент.
        </Text>
      </View>

      <View style={styles.cards}>
        <View style={[styles.card, styles.cardYearly]}>
          <Text style={styles.cardBadge}>Выгоднее</Text>
          <Text style={styles.cardTitle}>Год</Text>
          <Text style={styles.cardPrice}>{getPrice(SUBSCRIPTION_PRODUCT_IDS.YEARLY)}</Text>
          <Text style={styles.cardPeriod}>в год</Text>
          <Button
            title={purchasingId === SUBSCRIPTION_PRODUCT_IDS.YEARLY ? 'Оформление...' : 'Выбрать год'}
            onPress={() => handlePurchase(SUBSCRIPTION_PRODUCT_IDS.YEARLY)}
            loading={purchasingId === SUBSCRIPTION_PRODUCT_IDS.YEARLY}
            disabled={!!purchasingId || !iapReady}
            style={styles.cardButton}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Месяц</Text>
          <Text style={styles.cardPrice}>{getPrice(SUBSCRIPTION_PRODUCT_IDS.MONTHLY)}</Text>
          <Text style={styles.cardPeriod}>в месяц</Text>
          <Button
            title={purchasingId === SUBSCRIPTION_PRODUCT_IDS.MONTHLY ? 'Оформление...' : 'Выбрать месяц'}
            onPress={() => handlePurchase(SUBSCRIPTION_PRODUCT_IDS.MONTHLY)}
            loading={purchasingId === SUBSCRIPTION_PRODUCT_IDS.MONTHLY}
            disabled={!!purchasingId || !iapReady}
            style={styles.cardButton}
          />
        </View>

        <View style={[styles.card, styles.cardTest]}>
          <Text style={styles.cardBadgeTest}>Для теста</Text>
          <Text style={styles.cardTitle}>Без ограничений</Text>
          <Text style={styles.cardPrice}>Тестовый режим</Text>
          <Text style={styles.cardPeriod}>полный доступ без подписки</Text>
          <Button
            title="Использовать для теста"
            onPress={async () => {
              await setCachedSubscription({ hasAccess: true, testMode: true });
              onSuccess?.();
            }}
            variant="outline"
            style={styles.cardButton}
          />
        </View>
      </View>

      {!iapReady && (
        <>
          <Text style={styles.devNote}>
            Покупки доступны в собственной сборке приложения (не в Expo Go).
          </Text>
          {__DEV__ && (
            <Button
              title="Продолжить без подписки (тест)"
              onPress={onSuccess}
              variant="outline"
              style={styles.devButton}
            />
          )}
        </>
      )}

      <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreButton}>
        <Text style={styles.restoreText}>{restoring ? 'Проверка...' : 'Восстановить покупки'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 80,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cards: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  cardYearly: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  cardTest: {
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  cardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.accent,
  },
  cardBadgeTest: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.textSecondary,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
  },
  cardPeriod: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  cardButton: {
    marginTop: 4,
  },
  devNote: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  devButton: {
    marginBottom: 16,
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: colors.accent,
  },
});
