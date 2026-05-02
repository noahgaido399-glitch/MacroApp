import { BodyWeightEntry, FoodEntry, MacroGoals, MealCategory, SavedMeal } from '../types';
import { defaultGoals } from '../utils/macros';

type WebStore = {
  foodEntries: FoodEntry[];
  savedMeals: SavedMeal[];
  bodyWeights: BodyWeightEntry[];
  goals: MacroGoals;
  seeded: boolean;
};

const webStoreKey = 'macro-streak-store-v1';

const seedMeals = [
  {
    id: 'seed-chicken-rice',
    name: 'Chicken and Rice',
    calories: 650,
    protein: 60,
    carbs: 80,
    fats: 8,
    servingAmount: '1 bowl',
    mealCategory: 'lunch' as MealCategory,
  },
  {
    id: 'seed-bananas-krispy',
    name: '2 Bananas + Rice Krispy',
    calories: 330,
    protein: 3,
    carbs: 95,
    fats: 2,
    servingAmount: '1 snack',
    mealCategory: 'pre-workout' as MealCategory,
  },
  {
    id: 'seed-bagel-chicken',
    name: 'Plain Bagel + Chicken',
    calories: 400,
    protein: 35,
    carbs: 50,
    fats: 5,
    servingAmount: '1 plate',
    mealCategory: 'lunch' as MealCategory,
  },
];

function makeSeedMeals(): SavedMeal[] {
  const createdAt = new Date().toISOString();
  return seedMeals.map((meal) => ({ ...meal, createdAt }));
}

function makeEmptyWebStore(): WebStore {
  return {
    foodEntries: [],
    savedMeals: makeSeedMeals(),
    bodyWeights: [],
    goals: defaultGoals,
    seeded: true,
  };
}

function readWebStore(): WebStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return makeEmptyWebStore();
  }

  const raw = window.localStorage.getItem(webStoreKey);
  if (!raw) {
    const seeded = makeEmptyWebStore();
    writeWebStore(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebStore>;
    const store: WebStore = {
      foodEntries: parsed.foodEntries ?? [],
      savedMeals: parsed.savedMeals?.length ? parsed.savedMeals : makeSeedMeals(),
      bodyWeights: parsed.bodyWeights ?? [],
      goals: { ...defaultGoals, ...parsed.goals },
      seeded: parsed.seeded ?? true,
    };
    if (!parsed.seeded || !parsed.savedMeals?.length) {
      writeWebStore(store);
    }
    return store;
  } catch {
    const reset = makeEmptyWebStore();
    writeWebStore(reset);
    return reset;
  }
}

function writeWebStore(store: WebStore) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(webStoreKey, JSON.stringify(store));
  }
}

export async function initDatabase() {
  readWebStore();
}

export async function getGoals(): Promise<MacroGoals> {
  return readWebStore().goals;
}

export async function saveGoals(goals: MacroGoals) {
  const store = readWebStore();
  writeWebStore({ ...store, goals });
}

export async function getFoodEntries(): Promise<FoodEntry[]> {
  return [...readWebStore().foodEntries].sort((a, b) => {
    if (a.date === b.date) {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return b.date.localeCompare(a.date);
  });
}

export async function upsertFoodEntry(entry: FoodEntry) {
  const store = readWebStore();
  const nextEntries = [entry, ...store.foodEntries.filter((item) => item.id !== entry.id)];
  writeWebStore({ ...store, foodEntries: nextEntries });
}

export async function deleteFoodEntry(id: string) {
  const store = readWebStore();
  writeWebStore({ ...store, foodEntries: store.foodEntries.filter((entry) => entry.id !== id) });
}

export async function getSavedMeals(): Promise<SavedMeal[]> {
  return [...readWebStore().savedMeals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function upsertSavedMeal(meal: SavedMeal) {
  const store = readWebStore();
  const nextMeals = [meal, ...store.savedMeals.filter((item) => item.id !== meal.id)];
  writeWebStore({ ...store, savedMeals: nextMeals });
}

export async function deleteSavedMeal(id: string) {
  const store = readWebStore();
  writeWebStore({ ...store, savedMeals: store.savedMeals.filter((meal) => meal.id !== id) });
}

export async function getBodyWeights(): Promise<BodyWeightEntry[]> {
  return [...readWebStore().bodyWeights].sort((a, b) => a.date.localeCompare(b.date));
}

export async function upsertBodyWeight(entry: BodyWeightEntry) {
  const store = readWebStore();
  const nextWeights = [...store.bodyWeights.filter((item) => item.date !== entry.date), entry].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  writeWebStore({ ...store, bodyWeights: nextWeights });
}

export async function deleteBodyWeight(date: string) {
  const store = readWebStore();
  writeWebStore({ ...store, bodyWeights: store.bodyWeights.filter((entry) => entry.date !== date) });
}
