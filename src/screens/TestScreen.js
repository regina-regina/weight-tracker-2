import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TestScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Тестовый экран работает!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#2C2C2C',
  },
});
