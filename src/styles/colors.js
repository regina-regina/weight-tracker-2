/**
 * Палитра "Soft Dietitian" — единая семантическая система цветов приложения.
 * Использование: import { AppColors } from '../styles/colors';
 */

export const AppColors = {
  // Основные цвета
  deepSea: '#3D6B7D',
  sageMint: '#8AB5A8',
  peachyGlow: '#EDB89A',
  softBlush: '#F4D5D5',
  cloudCream: '#F5F1E8',
  coralAccent: '#E89A7D',
  white: '#FFFFFF',

  // Светлые вариации (фоны карточек)
  sageMintLight: '#D4E8E3',
  peachyLight: '#F9E8DC',
  blueLight: '#C8DBE0',
  beigeWarm: '#E8E0D8',
  screenBackground: '#FDFCFA',

  // Семантические
  successGreen: '#5A9B8A',
  warningRed: '#D87A7A',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  inactive: '#B2BEC3',

  // Специфичные подписи/акценты
  bmiSub: '#6B8E84',
  goalTitle: '#8B5A3C',
  fatEmptyValue: '#95A5A6',
  fatFilledIcon: '#E8A4B8',
  fatFilledSub: '#B85577',
  caloriesSub: '#5A7B8A',
  caloriesIcon: '#7CA8B8',
  bmrStripTitle: '#6B5E52',
  bmrStripSub: '#8B7D72',
  bmrStripDivider: '#D4C8BC',
  deficitStripDivider: '#EDD4C0',
  activeCalSub: '#6B8E84',
  activeCalDivider: '#C0DED8',
  historyNeutral: '#8B7D72',

  // Графики
  chartInactiveBorder: '#E8D8D8',
  chartWeightGrid: '#F0E5E5',
  chartFatGrid: '#C8E0DB',
  chartAxisLabel: '#8B7D72',

  // Профиль
  profilePaceIcon: '#D8934A',
  profilePaceActiveBg: '#FFF5EF',
  profileFieldLabel: '#8B6B70',
  profileActivityIcon: '#9B8B7A',

  // Навигация
  navTopBorder: '#F0F0F0',
  tabBarBorder: '#F0F0F0',
  cardBackground: '#FFFFFF',

  // Тени и общие стили
  cardRadius: 16,
  cardShadow: {
    shadowColor: '#3D6B7D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fabShadow: {
    shadowColor: '#E89A7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Алиасы для логина/онбординга/подписок/навигации
  accent: '#E89A7D',
  textLight: '#B2BEC3',
  success: '#5A9B8A',
  primary: '#E89A7D',
  background: '#FDFCFA',
  tabBarActive: '#E89A7D',
  tabBarInactive: '#B2BEC3',
  tabBarBackground: '#FFFFFF',
  tileMint: '#D4E8E3',
};

export const colors = AppColors;
