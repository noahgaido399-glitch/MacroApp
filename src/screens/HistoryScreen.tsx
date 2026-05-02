import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';
import { useAppData } from '../state/AppDataContext';
import { colors } from '../theme';
import { addDays, formatDayLabel, getRecentDateKeys, toDateKey } from '../utils/dates';
import { didHitGoal, sumEntries } from '../utils/macros';

export function HistoryScreen() {
  const { entries, goals } = useAppData();
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const dateKeys = useMemo(() => getRecentDateKeys(21), []);
  const selectedEntries = useMemo(() => entries.filter((entry) => entry.date === selectedDate), [entries, selectedDate]);
  const totals = useMemo(() => sumEntries(selectedEntries), [selectedEntries]);
  const hitGoal = didHitGoal(totals, goals);

  return (
    <Screen title="History" subtitle="Review daily totals and goal-hit days.">
      <View style={styles.calendarGrid}>
        {dateKeys.map((date) => {
          const dayTotals = sumEntries(entries.filter((entry) => entry.date === date));
          const successful = didHitGoal(dayTotals, goals);
          const selected = selectedDate === date;
          const dayNumber = Number(date.slice(-2));
          return (
            <Pressable
              key={date}
              onPress={() => setSelectedDate(date)}
              style={[styles.dayCell, successful && styles.daySuccess, selected && styles.daySelected]}
            >
              <Text style={[styles.dayText, successful && styles.dayTextSuccess]}>{dayNumber}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{formatDayLabel(selectedDate)}</Text>
            <Text style={styles.entryCount}>{selectedEntries.length} foods logged</Text>
          </View>
          <View style={[styles.hitBadge, hitGoal && styles.hitBadgeGood]}>
            <Ionicons name={hitGoal ? 'checkmark' : 'close'} color={hitGoal ? '#071007' : colors.muted} size={18} />
          </View>
        </View>
        <View style={styles.progressStack}>
          <ProgressBar label="Calories" value={totals.calories} goal={goals.calories} unit="" color={colors.calories} />
          <ProgressBar label="Protein" value={totals.protein} goal={goals.protein} color={colors.protein} />
          <ProgressBar label="Carbs" value={totals.carbs} goal={goals.carbs} color={colors.carbs} />
          <ProgressBar label="Fats" value={totals.fats} goal={goals.fats} color={colors.fats} />
        </View>
      </Card>

      <View style={styles.navRow}>
        <Pressable style={styles.navButton} onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
          <Text style={styles.navText}>Previous</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={() => setSelectedDate(addDays(selectedDate, 1))}>
          <Text style={styles.navText}>Next</Text>
          <Ionicons name="chevron-forward" color={colors.text} size={20} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  date: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  dayCell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  daySelected: {
    borderColor: colors.text,
    borderWidth: 2,
  },
  daySuccess: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  dayText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  dayTextSuccess: {
    color: colors.text,
  },
  entryCount: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hitBadge: {
    alignItems: 'center',
    backgroundColor: colors.field,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  hitBadgeGood: {
    backgroundColor: colors.accent,
  },
  navButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  progressStack: {
    gap: 15,
    marginTop: 18,
  },
});
