import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import {
  deleteBodyWeight,
  deleteFoodEntry,
  deleteSavedMeal,
  getBodyWeights,
  getFoodEntries,
  getGoals,
  getSavedMeals,
  initDatabase,
  saveGoals,
  upsertBodyWeight,
  upsertFoodEntry,
  upsertSavedMeal,
} from '../data/database';
import { BodyWeightEntry, FoodEntry, MacroGoals, SavedMeal } from '../types';
import { toDateKey } from '../utils/dates';

type AppDataContextValue = {
  bodyWeights: BodyWeightEntry[];
  entries: FoodEntry[];
  goals: MacroGoals;
  isReady: boolean;
  refresh: () => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  removeSavedMeal: (id: string) => Promise<void>;
  savedMeals: SavedMeal[];
  removeBodyWeight: (date: string) => Promise<void>;
  saveBodyWeight: (entry: BodyWeightEntry) => Promise<void>;
  saveEntry: (entry: FoodEntry) => Promise<void>;
  saveMeal: (meal: SavedMeal) => Promise<void>;
  setGoals: (goals: MacroGoals) => Promise<void>;
  logSavedMealToday: (meal: SavedMeal) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const [bodyWeights, setBodyWeights] = useState<BodyWeightEntry[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [goals, setGoalsState] = useState<MacroGoals>({ calories: 2500, protein: 180, carbs: 250, fats: 70 });
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    await initDatabase();
    const [nextEntries, nextSavedMeals, nextGoals, nextBodyWeights] = await Promise.all([
      getFoodEntries(),
      getSavedMeals(),
      getGoals(),
      getBodyWeights(),
    ]);
    setEntries(nextEntries);
    setSavedMeals(nextSavedMeals);
    setGoalsState(nextGoals);
    setBodyWeights(nextBodyWeights);
    setIsReady(true);
  }, []);

  const saveEntry = useCallback(
    async (entry: FoodEntry) => {
      await upsertFoodEntry(entry);
      await refresh();
    },
    [refresh],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await deleteFoodEntry(id);
      await refresh();
    },
    [refresh],
  );

  const saveMeal = useCallback(
    async (meal: SavedMeal) => {
      await upsertSavedMeal(meal);
      await refresh();
    },
    [refresh],
  );

  const removeSavedMeal = useCallback(
    async (id: string) => {
      await deleteSavedMeal(id);
      await refresh();
    },
    [refresh],
  );

  const setGoals = useCallback(
    async (nextGoals: MacroGoals) => {
      await saveGoals(nextGoals);
      await refresh();
    },
    [refresh],
  );

  const saveBodyWeight = useCallback(
    async (entry: BodyWeightEntry) => {
      await upsertBodyWeight(entry);
      await refresh();
    },
    [refresh],
  );

  const removeBodyWeight = useCallback(
    async (date: string) => {
      await deleteBodyWeight(date);
      await refresh();
    },
    [refresh],
  );

  const logSavedMealToday = useCallback(
    async (meal: SavedMeal) => {
      await upsertFoodEntry({
        id: makeId('entry'),
        date: toDateKey(),
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        servingAmount: meal.servingAmount,
        mealCategory: meal.mealCategory,
        createdAt: new Date().toISOString(),
      });
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      bodyWeights,
      entries,
      goals,
      isReady,
      logSavedMealToday,
      refresh,
      removeBodyWeight,
      removeEntry,
      removeSavedMeal,
      savedMeals,
      saveBodyWeight,
      saveEntry,
      saveMeal,
      setGoals,
    }),
    [
      bodyWeights,
      entries,
      goals,
      isReady,
      logSavedMealToday,
      refresh,
      removeBodyWeight,
      removeEntry,
      removeSavedMeal,
      savedMeals,
      saveBodyWeight,
      saveEntry,
      saveMeal,
      setGoals,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return value;
}
