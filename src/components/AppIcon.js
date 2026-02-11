import React from 'react';
import { Platform, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WEB_ICON_MAP = {
  'home': '🏠',
  'home-outline': '🏠',
  'list': '📋',
  'list-outline': '📋',
  'bar-chart': '📊',
  'bar-chart-outline': '📊',
  'person': '👤',
  'person-outline': '👤',
  'add': '➕',
  'close': '✕',
  'calendar-outline': '📅',
  'arrow-down': '↓',
  'arrow-up': '↑',
  'remove': '−',
};

export function AppIcon({ name, size = 24, color }) {
  if (Platform.OS === 'web' && WEB_ICON_MAP[name]) {
    return (
      <Text style={[styles.emoji, { fontSize: size * 0.85 }]}>
        {WEB_ICON_MAP[name]}
      </Text>
    );
  }
  return <Ionicons name={name} size={size} color={color} />;
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});
