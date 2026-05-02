import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isReady, refresh } = useAppData();
  const activeTab = tabs[activeIndex]?.key ?? 'home';

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    pagerRef.current?.scrollTo({ x: activeIndex * width, animated: false });
  }, [activeIndex, width]);

  const goToTab = (index: number) => {
    setActiveIndex(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex !== activeIndex && tabs[nextIndex]) {
      setActiveIndex(nextIndex);
    }
  };

  const renderScreen = (tab: TabKey) => {
    switch (tab) {
      case 'home':
        return <HomeScreen onAddFood={() => goToTab(1)} onOpenMeals={() => goToTab(2)} />;
      case 'add':
        return <AddFoodScreen onSaved={() => goToTab(0)} />;
      case 'meals':
        return <SavedMealsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  const screens = useMemo(() => tabs.map((tab) => ({ ...tab, screen: renderScreen(tab.key) })), [width]);

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
      <ScrollView
        ref={pagerRef}
        horizontal
        keyboardShouldPersistTaps="handled"
        onMomentumScrollEnd={handleMomentumEnd}
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.content}
      >
        {screens.map((item) => (
          <View key={item.key} style={[styles.page, { width }]}>
            {item.screen}
          </View>
        ))}
      </ScrollView>
      <View style={styles.tabWrap}>
        <View style={styles.tabBar}>
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={tab.key}
                onPress={() => goToTab(index)}
                style={styles.tab}
              >
                <View style={[styles.iconShell, isActive && styles.iconShellActive]}>
                  <Ionicons name={tab.icon} size={21} color={isActive ? colors.background : colors.muted} />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
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
  page: {
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
  iconShell: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 42,
  },
  iconShellActive: {
    backgroundColor: colors.accent,
  },
  tabBar: {
    backgroundColor: colors.nav,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: colors.text,
  },
  tabWrap: {
    backgroundColor: 'transparent',
    bottom: 0,
    left: 0,
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 6,
    position: 'absolute',
    right: 0,
  },
});
