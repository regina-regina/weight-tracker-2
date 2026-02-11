// Product ID должны совпадать с настройками в App Store Connect и Google Play Console
export const SUBSCRIPTION_PRODUCT_IDS = {
  MONTHLY: 'weight_tracker_monthly',
  YEARLY: 'weight_tracker_yearly',
};

export const SUBSCRIPTION_PRICES = {
  MONTHLY: 149,
  YEARLY: 599,
};

export const SUBSCRIPTION_STORAGE_KEY = '@weight_tracker_subscription';

// Включи true, чтобы при каждом входе показывался экран подписки (для проверки). Перед релизом поставь false.
export const FORCE_SHOW_PAYWALL = true;
