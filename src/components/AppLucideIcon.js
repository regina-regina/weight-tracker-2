import React from 'react';
import {
  Activity,
  Target,
  Ruler,
  Flame,
  Zap,
  BatteryCharging,
  Timer,
  Footprints,
  User,
  PersonStanding,
  TrendingUp,
  Home,
  Clock,
  ChartBar,
  Scale,
  Plus,
  X,
  Calendar,
  ArrowDown,
  ArrowUp,
  Minus,
} from 'lucide-react-native';
import { AppColors } from '../styles/colors';

const ICON_MAP = {
  activity: Activity,
  target: Target,
  ruler: Ruler,
  flame: Flame,
  zap: Zap,
  batteryCharging: BatteryCharging,
  timer: Timer,
  footprints: Footprints,
  user: User,
  trendingUp: TrendingUp,
  home: Home,
  clock: Clock,
  chartBar: ChartBar,
  scale: Scale,
  plus: Plus,
  personStanding: PersonStanding,
  close: X,
  calendar: Calendar,
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  minus: Minus,
};

export const sizeSmall = 16;
export const sizeMedium = 24;
export const sizeLarge = 32;
export const strokeWidth = 2;

export function getIconColor(type) {
  switch (type) {
    case 'bmi':
      return AppColors.sageMint;
    case 'goal':
      return AppColors.peachyGlow;
    case 'measurements_empty':
      return AppColors.inactive;
    case 'measurements_filled':
      return AppColors.fatFilledIcon;
    case 'calories':
      return AppColors.caloriesIcon;
    case 'metabolism':
    case 'expenditure':
      return AppColors.bmrStripSub;
    case 'pace':
      return AppColors.goalTitle;
    case 'activity':
      return AppColors.bmiSub;
    case 'user':
    case 'chart':
      return AppColors.deepSea;
    case 'profile_pace':
      return AppColors.profilePaceIcon;
    case 'profile_goal':
      return AppColors.sageMint;
    case 'profile_activity':
      return AppColors.profileActivityIcon;
    default:
      return AppColors.deepSea;
  }
}

export function AppLucideIcon({ name, type, size = sizeMedium, color, strokeWidth: sw = strokeWidth, ...rest }) {
  const IconComponent = typeof name === 'string' ? ICON_MAP[name] : name;
  if (!IconComponent) return null;
  const iconColor = color != null ? color : (type ? getIconColor(type) : AppColors.deepSea);
  return (
    <IconComponent
      size={size}
      color={iconColor}
      strokeWidth={sw}
      {...rest}
    />
  );
}

export default AppLucideIcon;
