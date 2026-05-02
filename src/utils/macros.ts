import { FoodEntry, MacroGoals, MacroTotals, StreakStats } from '../types';
import { addDays, toDateKey } from './dates';

export const defaultGoals: MacroGoals = {
  calories: 2500,
  protein: 180,
  carbs: 250,
  fats: 70,
};

export const emptyTotals: MacroTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
};

export function sumEntries(entries: Pick<FoodEntry, 'calories' | 'protein' | 'carbs' | 'fats'>[]): MacroTotals {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fats: totals.fats + entry.fats,
    }),
    emptyTotals,
  );
}

export function didHitGoal(totals: MacroTotals, goals: MacroGoals) {
  return Math.abs(totals.calories - goals.calories) <= 150 && totals.protein >= goals.protein;
}

export function calculateStreaks(entries: FoodEntry[], goals: MacroGoals, today = toDateKey()): StreakStats {
  const byDate = entries.reduce<Record<string, FoodEntry[]>>((groups, entry) => {
    const dayEntries = groups[entry.date] ?? [];
    groups[entry.date] = [...dayEntries, entry];
    return groups;
  }, {});

  const successfulDates = new Set(
    Object.entries(byDate)
      .filter(([, dayEntries]) => didHitGoal(sumEntries(dayEntries), goals))
      .map(([date]) => date),
  );

  let current = 0;
  let cursor = today;
  while (successfulDates.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const sortedDates = [...successfulDates].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of sortedDates) {
    if (previous && addDays(previous, 1) === date) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    previous = date;
  }

  return { current, best, successfulDates };
}
