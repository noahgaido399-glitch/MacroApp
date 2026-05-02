import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { Screen } from '../components/Screen';
import { useAppData } from '../state/AppDataContext';
import { MacroGoals } from '../types';
import { useEffect, useState } from 'react';

export function SettingsScreen() {
  const { goals, setGoals } = useAppData();
  const [draft, setDraft] = useState<Record<keyof MacroGoals, string>>({
    calories: String(goals.calories),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fats: String(goals.fats),
  });

  useEffect(() => {
    setDraft({
      calories: String(goals.calories),
      protein: String(goals.protein),
      carbs: String(goals.carbs),
      fats: String(goals.fats),
    });
  }, [goals]);

  const update = (key: keyof MacroGoals, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    const nextGoals = {
      calories: Number(draft.calories),
      protein: Number(draft.protein),
      carbs: Number(draft.carbs),
      fats: Number(draft.fats),
    };

    if (Object.values(nextGoals).some((value) => Number.isNaN(value) || value <= 0)) {
      Alert.alert('Check goals', 'All goals must be numbers above zero.');
      return;
    }

    await setGoals(nextGoals);
    Alert.alert('Goals saved', 'Your dashboard and streaks now use these targets.');
  };

  return (
    <Screen title="Settings" subtitle="Adjust the daily targets used for progress and streaks.">
      <Card>
        <View style={styles.form}>
          <Field keyboardType="numeric" label="Calories" value={draft.calories} onChangeText={(value) => update('calories', value)} />
          <Field keyboardType="numeric" label="Protein" value={draft.protein} onChangeText={(value) => update('protein', value)} />
          <Field keyboardType="numeric" label="Carbs" value={draft.carbs} onChangeText={(value) => update('carbs', value)} />
          <Field keyboardType="numeric" label="Fats" value={draft.fats} onChangeText={(value) => update('fats', value)} />
          <Button icon="save-outline" label="Save Goals" onPress={save} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
});
