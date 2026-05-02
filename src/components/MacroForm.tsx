import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { Field } from './Field';
import { colors } from '../theme';
import { FoodEntry, MealCategory, SavedMeal } from '../types';

export type MacroFormValues = {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  servingAmount: string;
  mealCategory: MealCategory;
};

const categories: MealCategory[] = ['pre-workout', 'lunch', 'dinner', 'snack'];

export function valuesFromMacroItem(item?: FoodEntry | SavedMeal): MacroFormValues {
  return {
    name: item?.name ?? '',
    calories: item ? String(item.calories) : '',
    protein: item ? String(item.protein) : '',
    carbs: item ? String(item.carbs) : '',
    fats: item ? String(item.fats) : '',
    servingAmount: item?.servingAmount ?? '',
    mealCategory: item?.mealCategory ?? 'lunch',
  };
}

export function parseMacroForm(values: MacroFormValues) {
  const parsed = {
    name: values.name.trim(),
    calories: Number(values.calories),
    protein: Number(values.protein),
    carbs: Number(values.carbs),
    fats: Number(values.fats),
    servingAmount: values.servingAmount.trim() || '1 serving',
    mealCategory: values.mealCategory,
  };

  if (!parsed.name) {
    Alert.alert('Name required', 'Add a food or meal name.');
    return null;
  }

  if ([parsed.calories, parsed.protein, parsed.carbs, parsed.fats].some((value) => Number.isNaN(value) || value < 0)) {
    Alert.alert('Check macros', 'Calories and macros must be positive numbers.');
    return null;
  }

  return parsed;
}

type MacroFormProps = {
  initialItem?: FoodEntry | SavedMeal;
  initialValues?: MacroFormValues;
  submitLabel: string;
  onSubmit: (values: MacroFormValues) => void;
};

export function MacroForm({ initialItem, initialValues, submitLabel, onSubmit }: MacroFormProps) {
  const [values, setValues] = useState(initialValues ?? valuesFromMacroItem(initialItem));

  useEffect(() => {
    setValues(initialValues ?? valuesFromMacroItem(initialItem));
  }, [initialItem, initialValues]);

  const update = (key: keyof MacroFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <View style={styles.form}>
      <Field label="Name" value={values.name} onChangeText={(value) => update('name', value)} placeholder="Chicken and rice" />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Field
            keyboardType="decimal-pad"
            label="Calories"
            onChangeText={(value) => update('calories', value)}
            value={values.calories}
          />
        </View>
        <View style={styles.flex}>
          <Field keyboardType="decimal-pad" label="Protein" onChangeText={(value) => update('protein', value)} value={values.protein} />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Field keyboardType="decimal-pad" label="Carbs" onChangeText={(value) => update('carbs', value)} value={values.carbs} />
        </View>
        <View style={styles.flex}>
          <Field keyboardType="decimal-pad" label="Fats" onChangeText={(value) => update('fats', value)} value={values.fats} />
        </View>
      </View>
      <Field
        label="Serving"
        onChangeText={(value) => update('servingAmount', value)}
        placeholder="1 bowl"
        value={values.servingAmount}
      />
      <View style={styles.categoryGrid}>
        {categories.map((category) => {
          const selected = values.mealCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => setValues((current) => ({ ...current, mealCategory: category }))}
              style={[styles.category, selected && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{category}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button label={submitLabel} icon="checkmark-circle-outline" onPress={() => onSubmit(values)} />
    </View>
  );
}

const styles = StyleSheet.create({
  category: {
    alignItems: 'center',
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  categoryActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: colors.text,
  },
  flex: {
    flex: 1,
  },
  form: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
