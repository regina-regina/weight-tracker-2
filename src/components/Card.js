import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppColors } from '../styles/colors';

export const Card = ({ children, color, style }) => {
  return (
    <View style={[styles.card, color && { backgroundColor: color }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: AppColors.cardRadius,
    padding: 20,
    marginBottom: 14,
    backgroundColor: AppColors.white,
    ...AppColors.cardShadow,
  },
});
