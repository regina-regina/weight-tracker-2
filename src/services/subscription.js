import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_PRODUCT_IDS, SUBSCRIPTION_STORAGE_KEY, FORCE_SHOW_PAYWALL } from '../utils/subscriptionConstants';

let iapModule = undefined;
let iapAvailable = null;
let purchaseListenerRemove = null;
let purchaseErrorListenerRemove = null;

function getIAP() {
  if (iapModule !== undefined) return iapModule;
  try {
    iapModule = require('react-native-iap');
  } catch (e) {
    iapModule = null;
  }
  return iapModule;
}

function getSkus() {
  return [SUBSCRIPTION_PRODUCT_IDS.MONTHLY, SUBSCRIPTION_PRODUCT_IDS.YEARLY];
}

export async function isIAPAvailable() {
  if (iapAvailable !== null) return iapAvailable;
  const iap = getIAP();
  if (!iap) {
    iapAvailable = false;
    return false;
  }
  try {
    await iap.initConnection();
    iapAvailable = true;
    return true;
  } catch (e) {
    iapAvailable = false;
    return false;
  }
}

export async function getSubscriptionProducts() {
  if (!(await isIAPAvailable())) return [];
  const iap = getIAP();
  if (!iap) return [];
  try {
    const products = await iap.fetchProducts({ skus: getSkus(), type: 'subs' });
    return Array.isArray(products) ? products : [];
  } catch (e) {
    console.warn('getSubscriptionProducts:', e?.message || e);
    return [];
  }
}

export async function hasActiveSubscription() {
  if (FORCE_SHOW_PAYWALL) {
    const cached = await getCachedSubscription();
    if (cached?.testMode === true) return true;
    return false;
  }
  const available = await isIAPAvailable();
  if (!available) {
    const cached = await getCachedSubscription();
    if (cached?.hasAccess === true) return true;
    if (__DEV__) return true;
    return false;
  }
  const iap = getIAP();
  if (!iap) return false;
  try {
    const active = await iap.getActiveSubscriptions(getSkus());
    const hasActive = Array.isArray(active) && active.length > 0 && active.some((s) => s && s.isActive);
    if (hasActive) {
      await setCachedSubscription({ hasAccess: true });
      return true;
    }
    await setCachedSubscription({ hasAccess: false });
    return false;
  } catch (e) {
    console.warn('hasActiveSubscription:', e?.message || e);
    const cached = await getCachedSubscription();
    return cached?.hasAccess === true;
  }
}

export async function getCachedSubscription() {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setCachedSubscription(data) {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('setCachedSubscription:', e);
  }
}

export function requestSubscriptionPurchase(productId, { onSuccess, onError }) {
  const sku = productId;
  if (!sku) {
    onError?.({ message: 'Не указан продукт' });
    return () => {};
  }
  const iap = getIAP();
  if (!iap) {
    onError?.({ message: 'Покупки недоступны в этой сборке' });
    return () => {};
  }

  const onPurchaseUpdate = (purchase) => {
    if (purchase?.productId === sku) {
      setCachedSubscription({ hasAccess: true });
      iap.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
      purchaseListenerRemove?.();
      purchaseErrorListenerRemove?.();
      onSuccess?.();
    }
  };

  const onPurchaseError = (err) => {
    if (err?.code !== 'E_USER_CANCELLED') {
      onError?.(err);
    }
    purchaseListenerRemove?.();
    purchaseErrorListenerRemove?.();
  };

  purchaseListenerRemove = iap.purchaseUpdatedListener(onPurchaseUpdate);
  purchaseErrorListenerRemove = iap.purchaseErrorListener(onPurchaseError);

  const request = Platform.OS === 'ios'
    ? { apple: { sku } }
    : { google: { skus: [sku] } };
  iap.requestPurchase({ request, type: 'subs' }).catch((e) => {
    onError?.(e);
    purchaseListenerRemove?.();
    purchaseErrorListenerRemove?.();
  });

  return () => {
    purchaseListenerRemove?.();
    purchaseErrorListenerRemove?.();
  };
}

export async function restoreSubscriptionPurchases() {
  const available = await isIAPAvailable();
  if (!available) return false;
  const iap = getIAP();
  if (!iap) return false;
  try {
    await iap.restorePurchases();
    return await hasActiveSubscription();
  } catch (e) {
    console.warn('restoreSubscriptionPurchases:', e?.message || e);
    return false;
  }
}

export async function disconnectIAP() {
  const iap = getIAP();
  if (iap) {
    try {
      purchaseListenerRemove?.();
      purchaseErrorListenerRemove?.();
      await iap.endConnection();
    } catch (_) {}
  }
  iapAvailable = null;
  iapModule = undefined;
}
