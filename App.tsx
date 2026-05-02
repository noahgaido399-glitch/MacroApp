import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { AddFoodScreen } from './src/screens/AddFoodScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SavedMealsScreen } from './src/screens/SavedMealsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AppDataProvider, useAppData } from './src/state/AppDataContext';
import { colors } from './src/theme';

type TabKey = 'home' | 'add' | 'meals' | 'history' | 'settings';

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'home', label: 'Today', icon: 'barbell-outline' },
  { key: 'add', label: 'Add', icon: 'add-circle-outline' },
  { key: 'meals', label: 'Meals', icon: 'restaurant-outline' },
  { key: 'history', label: 'History', icon: 'calendar-outline' },
  { key: 'settings', label: 'Goals', icon: 'settings-outline' },
];

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const { isReady, refresh } = useAppData();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const screen = useMemo(() => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onAddFood={() => setActiveTab('add')} onOpenMeals={() => setActiveTab('meals')} />;
      case 'add':
        return <AddFoodScreen onSaved={() => setActiveTab('home')} />;
      case 'meals':
        return <SavedMealsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  }, [activeTab]);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Loading Macro Streak</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.content}>{screen}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Ionicons name={tab.icon} size={22} color={isActive ? colors.accent : colors.muted} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <AppShell />
      </AppDataProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 12,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    gap: 2,
    paddingVertical: 6,
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: colors.text,
  },
});
