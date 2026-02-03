import React from 'react';
import { View, StyleSheet } from 'react-native';

export const Card = ({ children, color, style }) => {
  return (
    <View style={[styles.card, color && { backgroundColor: color }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#C8B8D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
});
