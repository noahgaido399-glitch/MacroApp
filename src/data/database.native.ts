import * as SQLite from 'expo-sqlite';

import { BodyWeightEntry, FoodEntry, MacroGoals, MealCategory, SavedMeal } from '../types';
import { defaultGoals } from '../utils/macros';

const dbPromise = SQLite.openDatabaseAsync('macro-streak.db');

type FoodEntryRow = {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_amount: string;
  meal_category: MealCategory;
  created_at: string;
};

type SavedMealRow = Omit<FoodEntryRow, 'date'>;

type BodyWeightRow = {
  date: string;
  weight: number;
  created_at: string;
};

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

function rowToEntry(row: FoodEntryRow): FoodEntry {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fats: row.fats,
    servingAmount: row.serving_amount,
    mealCategory: row.meal_category,
    createdAt: row.created_at,
  };
}

function rowToSavedMeal(row: SavedMealRow): SavedMeal {
  return {
    id: row.id,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fats: row.fats,
    servingAmount: row.serving_amount,
    mealCategory: row.meal_category,
    createdAt: row.created_at,
  };
}

function rowToBodyWeight(row: BodyWeightRow): BodyWeightEntry {
  return {
    date: row.date,
    weight: row.weight,
    createdAt: row.created_at,
  };
}

export async function initDatabase() {
  const db = await dbPromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL,
      serving_amount TEXT NOT NULL,
      meal_category TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_meals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fats REAL NOT NULL,
      serving_amount TEXT NOT NULL,
      meal_category TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_weights (
      date TEXT PRIMARY KEY NOT NULL,
      weight REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const settings = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['goals']);
  if (!settings) {
    await saveGoals(defaultGoals);
  }

  const mealCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM saved_meals');
  if (!mealCount || mealCount.count === 0) {
    for (const meal of seedMeals) {
      await upsertSavedMeal({
        ...meal,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

export async function getGoals(): Promise<MacroGoals> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['goals']);
  return row ? { ...defaultGoals, ...JSON.parse(row.value) } : defaultGoals;
}

export async function saveGoals(goals: MacroGoals) {
  const db = await dbPromise;
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['goals', JSON.stringify(goals)]);
}

export async function getFoodEntries(): Promise<FoodEntry[]> {
  const db = await dbPromise;
  const rows = await db.getAllAsync<FoodEntryRow>('SELECT * FROM food_entries ORDER BY date DESC, created_at DESC');
  return rows.map(rowToEntry);
}

export async function upsertFoodEntry(entry: FoodEntry) {
  const db = await dbPromise;
  await db.runAsync(
    `INSERT OR REPLACE INTO food_entries
      (id, date, name, calories, protein, carbs, fats, serving_amount, meal_category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.date,
      entry.name,
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fats,
      entry.servingAmount,
      entry.mealCategory,
      entry.createdAt,
    ],
  );
}

export async function deleteFoodEntry(id: string) {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
}

export async function getSavedMeals(): Promise<SavedMeal[]> {
  const db = await dbPromise;
  const rows = await db.getAllAsync<SavedMealRow>('SELECT * FROM saved_meals ORDER BY created_at DESC');
  return rows.map(rowToSavedMeal);
}

export async function upsertSavedMeal(meal: SavedMeal) {
  const db = await dbPromise;
  await db.runAsync(
    `INSERT OR REPLACE INTO saved_meals
      (id, name, calories, protein, carbs, fats, serving_amount, meal_category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.id,
      meal.name,
      meal.calories,
      meal.protein,
      meal.carbs,
      meal.fats,
      meal.servingAmount,
      meal.mealCategory,
      meal.createdAt,
    ],
  );
}

export async function deleteSavedMeal(id: string) {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM saved_meals WHERE id = ?', [id]);
}

export async function getBodyWeights(): Promise<BodyWeightEntry[]> {
  const db = await dbPromise;
  const rows = await db.getAllAsync<BodyWeightRow>('SELECT * FROM body_weights ORDER BY date ASC');
  return rows.map(rowToBodyWeight);
}

export async function upsertBodyWeight(entry: BodyWeightEntry) {
  const db = await dbPromise;
  await db.runAsync('INSERT OR REPLACE INTO body_weights (date, weight, created_at) VALUES (?, ?, ?)', [
    entry.date,
    entry.weight,
    entry.createdAt,
  ]);
}

export async function deleteBodyWeight(date: string) {
  const db = await dbPromise;
  await db.runAsync('DELETE FROM body_weights WHERE date = ?', [date]);
}
