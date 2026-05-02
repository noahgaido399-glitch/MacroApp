import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MacroForm, parseMacroForm } from '../components/MacroForm';
import { Screen } from '../components/Screen';
import { useAppData } from '../state/AppDataContext';
import { colors } from '../theme';
import { SavedMeal } from '../types';

function makeId() {
  return `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SavedMealsScreen() {
  const { logSavedMealToday, removeSavedMeal, savedMeals, saveMeal } = useAppData();
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Screen title="Saved Meals" subtitle="One tap for meals you eat on repeat.">
      <Button icon="add-outline" label="Create Saved Meal" onPress={() => setCreating(true)} />

      {savedMeals.map((meal) => (
        <Card key={meal.id}>
          <View style={styles.header}>
            <View style={styles.textBlock}>
              <Text style={styles.name}>{meal.name}</Text>
              <Text style={styles.meta}>
                {meal.servingAmount} · {meal.mealCategory}
              </Text>
            </View>
            <Text style={styles.calories}>{Math.round(meal.calories)}</Text>
          </View>
          <Text style={styles.macros}>
            P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
          </Text>
          <View style={styles.actions}>
            <View style={styles.logButton}>
              <Button
                icon="flash-outline"
                label="Add Today"
                onPress={async () => {
                  await logSavedMealToday(meal);
                  Alert.alert('Added', `${meal.name} was logged for today.`);
                }}
              />
            </View>
            <Pressable onPress={() => setEditingMeal(meal)} style={styles.iconButton}>
              <Ionicons name="create-outline" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert('Delete saved meal?', meal.name, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => void removeSavedMeal(meal.id) },
                ]);
              }}
              style={styles.iconButton}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        </Card>
      ))}

      <Modal animationType="slide" visible={creating || Boolean(editingMeal)} onRequestClose={() => {
        setCreating(false);
        setEditingMeal(null);
      }}>
        <View style={styles.modal}>
          <Screen title={editingMeal ? 'Edit Meal' : 'Create Meal'}>
            <MacroForm
              initialItem={editingMeal ?? undefined}
              submitLabel={editingMeal ? 'Save Meal' : 'Create Meal'}
              onSubmit={async (values) => {
                const parsed = parseMacroForm(values);
                if (!parsed) {
                  return;
                }
                await saveMeal({
                  id: editingMeal?.id ?? makeId(),
                  ...parsed,
                  createdAt: editingMeal?.createdAt ?? new Date().toISOString(),
                });
                setCreating(false);
                setEditingMeal(null);
              }}
            />
            <Button
              label="Cancel"
              onPress={() => {
                setCreating(false);
                setEditingMeal(null);
              }}
              variant="secondary"
            />
          </Screen>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  calories: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  logButton: {
    flex: 1,
  },
  macros: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  modal: {
    backgroundColor: colors.background,
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  textBlock: {
    flex: 1,
  },
});
