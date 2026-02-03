import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TestScreen } from '../screens/TestScreen';
import { colors } from '../styles/colors';

const Tab = createBottomTabNavigator();

const TabIcon = ({ color, emoji }) => {
  return <Text style={styles.icon}>{emoji}</Text>;
};

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Test"
        component={TestScreen}
        options={{
          title: 'Тест',
          tabBarIcon: ({ color }) => <TabIcon color={color} emoji="🏠" />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});
