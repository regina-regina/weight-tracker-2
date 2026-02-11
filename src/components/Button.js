import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AppColors } from '../styles/colors';

export const Button = ({ title, onPress, style, disabled, loading, variant = 'primary' }) => {
  const isDisabled = Boolean(disabled || loading);
  const isLoading = Boolean(loading);

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'outline':
        return styles.buttonOutline;
      case 'danger':
        return styles.buttonDanger;
      default:
        return styles.button;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonTextSecondary;
      case 'outline':
        return styles.buttonTextOutline;
      case 'danger':
        return styles.buttonTextDanger;
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? AppColors.white : AppColors.coralAccent}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Primary
  button: {
    backgroundColor: AppColors.coralAccent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...AppColors.cardShadow,
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.3,
  },

  // Secondary
  buttonSecondary: {
    backgroundColor: AppColors.cloudCream,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonTextSecondary: {
    color: AppColors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.3,
  },

  // Outline
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 2,
    borderColor: AppColors.coralAccent,
  },
  buttonTextOutline: {
    color: AppColors.coralAccent,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.3,
  },

  // Danger
  buttonDanger: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: AppColors.softBlush,
  },
  buttonTextDanger: {
    color: AppColors.warningRed,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.3,
  },

  buttonDisabled: {
    opacity: 0.45,
    shadowColor: 'transparent',
    elevation: 0,
  },
});
