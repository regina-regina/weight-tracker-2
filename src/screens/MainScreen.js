import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
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
  // refreshKey меняется после сохранения → дочерние экраны пересоздаются и делают re-fetch
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

  // После успешного сохранения обновляем все экраны
  const handleSaved = useCallback(() => {
    setShowAddEntry(false);
    setEditEntry(null);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const tabs = [
    { key: 'dashboard', label: 'Главная', icon: 'home', iconOutline: 'home-outline' },
    { key: 'history', label: 'История', icon: 'list', iconOutline: 'list-outline' },
    { key: 'charts', label: 'Графики', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
    { key: 'profile', label: 'Профиль', icon: 'person', iconOutline: 'person-outline' },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen key={`dashboard-${refreshKey}`} onAddEntry={handleAddEntry} />;
      case 'history':
        return <HistoryScreen key={`history-${refreshKey}`} onEditEntry={handleEditEntry} />;
      case 'charts':
        return <ChartsScreen key={`charts-${refreshKey}`} />;
      case 'profile':
        return <ProfileScreen key={`profile-${refreshKey}`} />;
      default:
        return <DashboardScreen key={`dashboard-${refreshKey}`} onAddEntry={handleAddEntry} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>

      {/* FAB — кнопка добавления записи (всегда видна) */}
      {activeTab !== 'profile' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddEntry}
          activeOpacity={0.8}
        >
          <AppIcon name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Modal добавления/редактирования */}
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
              <AppIcon
                name={isActive ? tab.icon : tab.iconOutline}
                size={24}
                color={isActive ? colors.tabBarActive : colors.tabBarInactive}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabActiveIndicator} />}
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
  content: {
    flex: 1,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBarBackground,
    height: 80,
    paddingBottom: 16,
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: colors.tabBarInactive,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  tabLabelActive: {
    fontFamily: 'Montserrat_600SemiBold',
    color: colors.tabBarActive,
    fontWeight: '600',
  },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.tabBarActive,
  },
});
