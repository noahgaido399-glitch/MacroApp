export type MealCategory = 'pre-workout' | 'lunch' | 'dinner' | 'snack';

export type MacroGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type MacroTotals = MacroGoals;

export type FoodEntry = {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingAmount: string;
  mealCategory: MealCategory;
  createdAt: string;
};

export type SavedMeal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingAmount: string;
  mealCategory: MealCategory;
  createdAt: string;
};

export type DaySummary = {
  date: string;
  totals: MacroTotals;
  hitGoal: boolean;
};

export type StreakStats = {
  current: number;
  best: number;
  successfulDates: Set<string>;
};
