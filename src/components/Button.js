import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../styles/colors';

export const Button = ({ title, onPress, style, disabled, loading, variant = 'primary' }) => {
  const isDisabled = Boolean(disabled || loading);
  const isLoading = Boolean(loading);

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':  return styles.buttonSecondary;
      case 'outline':    return styles.buttonOutline;
      case 'danger':     return styles.buttonDanger;
      default:           return styles.button;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':  return styles.buttonTextSecondary;
      case 'outline':    return styles.buttonTextOutline;
      case 'danger':     return styles.buttonTextDanger;
      default:           return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), isDisabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.78}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Primary — coral pill (как "Start Now!" в рефе)
  button: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.4,
  },

  // Secondary — мягкий серый
  buttonSecondary: {
    backgroundColor: '#F2ECF5',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonTextSecondary: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.4,
  },

  // Outline
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonTextOutline: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.4,
  },

  // Danger — лёгкий красный фон
  buttonDanger: {
    backgroundColor: '#FFF0F0',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  buttonTextDanger: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.4,
  },

  buttonDisabled: {
    opacity: 0.42,
    shadowColor: 'transparent',
    elevation: 0,
  },
});
