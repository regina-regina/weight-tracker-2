import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from './DashboardScreen';
import { HistoryScreen } from './HistoryScreen';
import { ChartsScreen } from './ChartsScreen';
import { ProfileScreen } from './ProfileScreen';
import { AddEntryScreen } from './AddEntryScreen';
import { colors } from '../styles/colors';

export const MainScreen = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddEntry = () => {
    setEditEntry(null);
    setShowAddEntry(true);
  };

  const handleEditEntry = (entry) => {
    setEditEntry(entry);
    setShowAddEntry(true);
  };

  const handleCloseEntry = () => {
    setShowAddEntry(false);
    setEditEntry(null);
  };

  const handleSaved = useCallback(() => {
    setShowAddEntry(false);
    setEditEntry(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Показывать кнопку + в header только на dashboard и history
  const showPlusButton = activeTab === 'dashboard' || activeTab === 'history';

  const tabs = [
    { key: 'dashboard', label: 'Главная', icon: 'home', iconOutline: 'home-outline' },
    { key: 'history', label: 'История', icon: 'list', iconOutline: 'list-outline' },
    { key: 'charts', label: 'Графики', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
    { key: 'profile', label: 'Профиль', icon: 'person', iconOutline: 'person-outline' },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen key={`d-${refreshKey}`} onAddEntry={handleAddEntry} />;
      case 'history':
        return <HistoryScreen key={`h-${refreshKey}`} onEditEntry={handleEditEntry} onAddEntry={handleAddEntry} />;
      case 'charts':
        return <ChartsScreen key={`c-${refreshKey}`} />;
      case 'profile':
        return <ProfileScreen key={`p-${refreshKey}`} />;
      default:
        return <DashboardScreen key={`d-${refreshKey}`} onAddEntry={handleAddEntry} />;
    }
  };

  // Заголовки для каждой вкладки
  const tabTitles = {
    dashboard: 'Главная',
    history: 'История',
    charts: 'Графики',
    profile: 'Профиль',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Общий header с названием и кнопкой + */}
      <View style={styles.appHeader}>
        <Text style={styles.appHeaderTitle}>{tabTitles[activeTab]}</Text>
        {showPlusButton && (
          <TouchableOpacity style={styles.plusButton} onPress={handleAddEntry} activeOpacity={0.75}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Контент */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* Modal добавления */}
      <Modal
        visible={showAddEntry}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseEntry}
      >
        <AddEntryScreen entry={editEntry} onClose={handleCloseEntry} onSaved={handleSaved} />
      </Modal>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                <Ionicons
                  name={isActive ? tab.icon : tab.iconOutline}
                  size={22}
                  color={isActive ? colors.tabBarActive : colors.tabBarInactive}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // App header
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  appHeaderTitle: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Montserrat_700Bold',
    color: colors.textPrimary,
  },
  plusButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  content: {
    flex: 1,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBarBackground,
    height: 76,
    paddingBottom: 14,
    paddingTop: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: '#FFF0EC',  // лёгкий coral tint
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: colors.tabBarInactive,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.tabBarActive,
  },
});
