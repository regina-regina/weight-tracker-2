import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../styles/colors';

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
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
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
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.3,
  },

  // Secondary
  buttonSecondary: {
    backgroundColor: '#F0F4F8',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  buttonTextSecondary: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.3,
  },

  // Outline
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonTextOutline: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.3,
  },

  // Danger
  buttonDanger: {
    backgroundColor: '#FFF0F0',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    borderWidth: 2,
    borderColor: '#FFCDD2',
  },
  buttonTextDanger: {
    color: '#FF5252',
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
