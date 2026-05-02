import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { MacroForm, parseMacroForm } from '../components/MacroForm';
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/Screen';
import { useAppData } from '../state/AppDataContext';
import { colors } from '../theme';
import { FoodEntry } from '../types';
import { formatDayLabel, toDateKey } from '../utils/dates';
import { calculateStreaks, didHitGoal, sumEntries } from '../utils/macros';

type HomeScreenProps = {
  onAddFood: () => void;
  onOpenMeals: () => void;
};

export function HomeScreen({ onAddFood, onOpenMeals }: HomeScreenProps) {
  const { bodyWeights, entries, goals, removeBodyWeight, removeEntry, saveBodyWeight, saveEntry } = useAppData();
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [weightDraft, setWeightDraft] = useState('');
  const today = toDateKey();
  const todayEntries = useMemo(() => entries.filter((entry) => entry.date === today), [entries, today]);
  const totals = useMemo(() => sumEntries(todayEntries), [todayEntries]);
  const hitGoal = didHitGoal(totals, goals);
  const streaks = useMemo(() => calculateStreaks(entries, goals), [entries, goals]);
  const todayWeight = useMemo(() => bodyWeights.find((entry) => entry.date === today), [bodyWeights, today]);
  const previousWeight = useMemo(
    () => [...bodyWeights].filter((entry) => entry.date < today).sort((a, b) => b.date.localeCompare(a.date))[0],
    [bodyWeights, today],
  );
  const weightDelta = todayWeight && previousWeight ? todayWeight.weight - previousWeight.weight : null;

  useEffect(() => {
    setWeightDraft(todayWeight ? String(todayWeight.weight) : '');
  }, [todayWeight]);

  const saveTodayWeight = async () => {
    const weight = Number(weightDraft);
    if (Number.isNaN(weight) || weight <= 0) {
      Alert.alert('Check bodyweight', 'Enter a bodyweight above zero.');
      return;
    }
    await saveBodyWeight({
      date: today,
      weight,
      createdAt: todayWeight?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <Screen title="Macro Streak" subtitle={formatDayLabel(today)}>
      <Card>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.kicker}>Today</Text>
            <Text style={styles.calories}>{Math.round(totals.calories)}</Text>
            <Text style={styles.goalText}>of {goals.calories} calories</Text>
          </View>
          <View style={[styles.statusPill, hitGoal && styles.statusPillGood]}>
            <Ionicons name={hitGoal ? 'checkmark-circle' : 'pulse-outline'} size={18} color={hitGoal ? '#071007' : colors.warning} />
            <Text style={[styles.statusText, hitGoal && styles.statusTextGood]}>{hitGoal ? 'Hit' : 'In progress'}</Text>
          </View>
        </View>
        <View style={styles.progressStack}>
          <ProgressBar label="Calories" value={totals.calories} goal={goals.calories} unit="" color={colors.calories} />
          <ProgressBar label="Protein" value={totals.protein} goal={goals.protein} color={colors.protein} />
          <ProgressBar label="Carbs" value={totals.carbs} goal={goals.carbs} color={colors.carbs} />
          <ProgressBar label="Fats" value={totals.fats} goal={goals.fats} color={colors.fats} />
        </View>
      </Card>

      <Card>
        <View style={styles.weightHeader}>
          <View>
            <Text style={styles.kicker}>Bodyweight</Text>
            <Text style={styles.weightValue}>{todayWeight ? `${todayWeight.weight.toFixed(1)} lb` : 'No weigh-in'}</Text>
            <Text style={styles.goalText}>
              {weightDelta === null
                ? 'Log today to start tracking'
                : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} lb vs previous`}
            </Text>
          </View>
          {todayWeight ? (
            <Pressable onPress={() => void removeBodyWeight(today)} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.weightInputRow}>
          <View style={styles.weightField}>
            <Field keyboardType="decimal-pad" label="Today lb" value={weightDraft} onChangeText={setWeightDraft} placeholder="185.0" />
          </View>
          <View style={styles.weightSave}>
            <Button icon="checkmark-outline" label="Save" onPress={() => void saveTodayWeight()} />
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.streakRow}>
          <View>
            <Text style={styles.kicker}>Current streak</Text>
            <Text style={styles.streakNumber}>{streaks.current}</Text>
          </View>
          <View style={styles.bestBox}>
            <Text style={styles.bestLabel}>Best</Text>
            <Text style={styles.bestValue}>{streaks.best}</Text>
          </View>
        </View>
        <Text style={styles.helper}>A day counts when calories land within 150 and protein hits goal.</Text>
      </Card>

      <View style={styles.actionRow}>
        <View style={styles.actionFlex}>
          <Button icon="add-outline" label="Add Food" onPress={onAddFood} />
        </View>
        <View style={styles.actionFlex}>
          <Button icon="restaurant-outline" label="Saved Meals" onPress={onOpenMeals} variant="secondary" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Logged today</Text>
        <Text style={styles.sectionCount}>{todayEntries.length}</Text>
      </View>

      {todayEntries.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No foods logged yet.</Text>
        </Card>
      ) : (
        todayEntries.map((entry) => (
          <Card key={entry.id}>
            <View style={styles.entryHeader}>
              <View style={styles.entryText}>
                <Text style={styles.entryName}>{entry.name}</Text>
                <Text style={styles.entryMeta}>
                  {entry.servingAmount} · {entry.mealCategory}
                </Text>
              </View>
              <Text style={styles.entryCalories}>{Math.round(entry.calories)}</Text>
            </View>
            <Text style={styles.macroLine}>
              P {entry.protein}g · C {entry.carbs}g · F {entry.fats}g
            </Text>
            <View style={styles.entryActions}>
              <Pressable onPress={() => setEditingEntry(entry)} style={styles.iconButton}>
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Alert.alert('Delete entry?', entry.name, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => void removeEntry(entry.id) },
                  ]);
                }}
                style={styles.iconButton}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <Modal animationType="slide" visible={Boolean(editingEntry)} onRequestClose={() => setEditingEntry(null)}>
        <View style={styles.modal}>
          <Screen title="Edit food">
            {editingEntry ? (
              <MacroForm
                initialItem={editingEntry}
                submitLabel="Save Changes"
                onSubmit={async (values) => {
                  const parsed = parseMacroForm(values);
                  if (!parsed) {
                    return;
                  }
                  await saveEntry({ ...editingEntry, ...parsed });
                  setEditingEntry(null);
                }}
              />
            ) : null}
            <Button label="Cancel" onPress={() => setEditingEntry(null)} variant="secondary" />
          </Screen>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionFlex: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bestBox: {
    alignItems: 'center',
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 86,
    padding: 12,
  },
  bestLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  bestValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  calories: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 0,
  },
  empty: {
    color: colors.muted,
    fontSize: 15,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  entryCalories: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  entryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  entryMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  entryName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  entryText: {
    flex: 1,
  },
  goalText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  heroRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 42,
  },
  kicker: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  macroLine: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  modal: {
    backgroundColor: colors.background,
    flex: 1,
  },
  progressStack: {
    gap: 15,
    marginTop: 18,
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  statusPill: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusPillGood: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '900',
  },
  statusTextGood: {
    color: '#071007',
  },
  streakNumber: {
    color: colors.accent,
    fontSize: 48,
    fontWeight: '900',
  },
  streakRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weightField: {
    flex: 1,
  },
  weightHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  weightInputRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  weightSave: {
    justifyContent: 'flex-end',
    minWidth: 96,
  },
  weightValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 3,
  },
});
